from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, AuthUser
from models.agency import CandidateSubmission, AgencyCandidate, JobRequisition, Client
from schemas.submissions import SubmissionCreate, SubmissionUpdate
from services.workflow import can_transition

router = APIRouter(prefix="/api/agency/submissions", tags=["submissions"])


@router.get("")
async def list_submissions(
    status: str | None = Query(None),
    job_id: str | None = Query(None),
    candidate_id: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(CandidateSubmission).where(CandidateSubmission.organizationId == auth.organization_id)
    if status and status != "all":
        query = query.where(CandidateSubmission.status == status)
    if job_id:
        query = query.where(CandidateSubmission.jobRequisitionId == job_id)
    if candidate_id:
        query = query.where(CandidateSubmission.candidateId == candidate_id)
    query = query.order_by(CandidateSubmission.createdAt.desc())
    result = await db.execute(query)
    submissions = result.scalars().all()

    sub_list = []
    for s in submissions:
        cand_result = await db.execute(select(AgencyCandidate).where(AgencyCandidate.id == s.candidateId))
        cand = cand_result.scalar_one_or_none()

        job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == s.jobRequisitionId))
        job = job_result.scalar_one_or_none()

        client = None
        if job:
            client_result = await db.execute(select(Client).where(Client.id == job.clientId))
            client = client_result.scalar_one_or_none()

        sub_list.append({
            "id": s.id,
            "status": s.status,
            "feedback": s.feedback,
            "interviewDate": s.interviewDate.isoformat() if s.interviewDate else None,
            "createdAt": s.createdAt.isoformat() if s.createdAt else None,
            "candidate": {
                "id": cand.id,
                "name": cand.name,
                "email": cand.email,
                "phone": cand.phone,
                "skills": cand.skills,
            } if cand else None,
            "jobRequisition": {
                "id": job.id,
                "title": job.title,
                "client": {
                    "id": client.id,
                    "name": client.name,
                } if client else None,
            } if job else None,
        })

    return {"success": True, "submissions": sub_list}


@router.post("")
async def create_submission(
    body: SubmissionCreate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    cand_result = await db.execute(
        select(AgencyCandidate).where(
            AgencyCandidate.id == body.candidate_id,
            AgencyCandidate.organizationId == auth.organization_id,
        )
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job_result = await db.execute(
        select(JobRequisition).where(
            JobRequisition.id == body.job_requisition_id,
            JobRequisition.organizationId == auth.organization_id,
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = await db.execute(
        select(CandidateSubmission).where(
            CandidateSubmission.candidateId == body.candidate_id,
            CandidateSubmission.jobRequisitionId == body.job_requisition_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Candidate already submitted for this job")

    submission = CandidateSubmission(
        candidateId=body.candidate_id,
        jobRequisitionId=body.job_requisition_id,
        organizationId=auth.organization_id,
        status="screening",
    )
    db.add(submission)

    if candidate.status == "sourced":
        candidate.status = "screening"

    await db.flush()

    return {
        "success": True,
        "submission": {
            "id": submission.id,
            "status": submission.status,
            "candidate": {"name": candidate.name, "email": candidate.email},
            "jobRequisition": {
                "title": job.title,
                "client": {"name": (await db.execute(select(Client).where(Client.id == job.client_id))).scalar_one_or_none().name if job else None},
            },
        },
    }


@router.put("")
async def update_submission(
    body: SubmissionUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CandidateSubmission).where(
            CandidateSubmission.id == body.id,
            CandidateSubmission.organizationId == auth.organization_id,
        )
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if body.status and not can_transition(submission.status, body.status):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from {submission.status} to {body.status}",
        )

    if body.status == "placed":
        raise HTTPException(
            status_code=400,
            detail="Complete placement details before marking as placed",
        )

    if body.status == "interview-scheduled" and not body.interview_date:
        raise HTTPException(
            status_code=400,
            detail="Interview date required for interview-scheduled status",
        )

    if body.status:
        submission.status = body.status
    if body.feedback is not None:
        submission.feedback = body.feedback or None
    if body.interview_date:
        from datetime import datetime
        try:
            submission.interviewDate = datetime.fromisoformat(body.interview_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid interview date")

    cand_result = await db.execute(
        select(AgencyCandidate).where(AgencyCandidate.id == submission.candidateId)
    )
    candidate = cand_result.scalar_one_or_none()

    if body.status and body.status != "rejected" and candidate:
        candidate.status = body.status
    elif body.status == "rejected" and candidate:
        other_active = await db.execute(
            select(CandidateSubmission).where(
                CandidateSubmission.candidateId == candidate.id,
                CandidateSubmission.id != submission.id,
                CandidateSubmission.status.notin_(["rejected", "placed"]),
            )
        )
        if not other_active.scalars().first():
            candidate.status = "rejected"

    return {
        "success": True,
        "submission": {
            "id": submission.id,
            "status": submission.status,
            "feedback": submission.feedback,
        },
    }
