from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, require_admin_only, AuthUser
from models.agency import (
    Placement, AgencyCandidate, Client, JobRequisition, CandidateSubmission,
)
from schemas.placements import PlacementCreate, PlacementUpdate

router = APIRouter(prefix="/api/agency/placements", tags=["placements"])


@router.get("")
async def list_placements(
    status: str | None = Query(None),
    client_id: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Placement).where(Placement.organizationId == auth.organization_id)
    if status and status != "all":
        query = query.where(Placement.status == status)
    if client_id:
        query = query.where(Placement.clientId == client_id)
    query = query.order_by(Placement.createdAt.desc())
    result = await db.execute(query)
    placements = result.scalars().all()

    pl_list = []
    for p in placements:
        cand_result = await db.execute(select(AgencyCandidate).where(AgencyCandidate.id == p.candidateId))
        cand = cand_result.scalar_one_or_none()
        client_result = await db.execute(select(Client).where(Client.id == p.clientId))
        client = client_result.scalar_one_or_none()
        job = None
        if p.jobRequisitionId:
            job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == p.jobRequisitionId))
            job = job_result.scalar_one_or_none()

        pl_list.append({
            "id": p.id,
            "startDate": p.startDate.isoformat() if p.startDate else None,
            "endDate": p.endDate.isoformat() if p.endDate else None,
            "salary": p.salary,
            "commissionRate": p.commissionRate,
            "commissionAmount": p.commissionAmount,
            "status": p.status,
            "notes": p.notes,
            "createdAt": p.createdAt.isoformat() if p.createdAt else None,
            "candidate": {"id": cand.id, "name": cand.name, "email": cand.email} if cand else None,
            "client": {"id": client.id, "name": client.name} if client else None,
            "jobRequisition": {"id": job.id, "title": job.title} if job else None,
        })

    total = await db.execute(
        select(func.count()).select_from(Placement).where(Placement.organizationId == auth.organization_id)
    )
    active = await db.execute(
        select(func.count()).select_from(Placement).where(
            Placement.organizationId == auth.organization_id, Placement.status == "active"
        )
    )
    commission = await db.execute(
        select(func.coalesce(func.sum(Placement.commissionAmount), 0)).where(
            Placement.organizationId == auth.organization_id
        )
    )

    return {
        "success": True,
        "placements": pl_list,
        "stats": {
            "totalPlacements": total.scalar() or 0,
            "activePlacements": active.scalar() or 0,
            "totalCommission": float(commission.scalar() or 0),
        },
    }


@router.post("")
async def create_placement(
    body: PlacementCreate,
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

    client_result = await db.execute(
        select(Client).where(Client.id == body.client_id, Client.organizationId == auth.organization_id)
    )
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if body.job_requisition_id:
        job_result = await db.execute(
            select(JobRequisition).where(
                JobRequisition.id == body.job_requisition_id,
                JobRequisition.organizationId == auth.organization_id,
            )
        )
        job = job_result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        sub_result = await db.execute(
            select(CandidateSubmission).where(
                CandidateSubmission.candidateId == body.candidate_id,
                CandidateSubmission.jobRequisitionId == body.job_requisition_id,
            )
        )
        sub = sub_result.scalar_one_or_none()
        if not sub or sub.status != "offered":
            raise HTTPException(status_code=400, detail="Submission must be in 'offered' status")

    existing = await db.execute(
        select(Placement).where(
            Placement.candidateId == body.candidate_id,
            Placement.clientId == body.client_id,
            Placement.organizationId == auth.organization_id,
            Placement.status == "active",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Active placement already exists")

    try:
        start_date = datetime.fromisoformat(body.start_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start date")

    commission_amount = None
    if body.salary and body.commission_rate:
        commission_amount = body.salary * body.commission_rate / 100

    placement = Placement(
        candidateId=body.candidate_id,
        clientId=body.client_id,
        jobRequisitionId=body.job_requisition_id,
        organizationId=auth.organization_id,
        startDate=start_date,
        salary=body.salary,
        commissionRate=body.commission_rate,
        commissionAmount=commission_amount,
        notes=body.notes,
    )
    db.add(placement)

    candidate.status = "placed"

    if body.job_requisition_id:
        job.filledCount = (job.filledCount or 0) + 1
        sub_result = await db.execute(
            select(CandidateSubmission).where(
                CandidateSubmission.candidateId == body.candidate_id,
                CandidateSubmission.jobRequisitionId == body.job_requisition_id,
            )
        )
        sub = sub_result.scalar_one_or_none()
        if sub:
            sub.status = "placed"

    await db.flush()

    return {
        "success": True,
        "placement": {
            "id": placement.id,
            "candidate": {"name": candidate.name},
            "client": {"name": client.name},
            "startDate": placement.startDate.isoformat(),
            "commissionAmount": placement.commissionAmount,
        },
    }


@router.put("")
async def update_placement(
    body: PlacementUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Placement).where(
            Placement.id == body.id,
            Placement.organizationId == auth.organization_id,
        )
    )
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"id"})
    if "end_date" in update_data and update_data["end_date"]:
        try:
            update_data["end_date"] = datetime.fromisoformat(update_data["end_date"])
        except (ValueError, TypeError):
            del update_data["end_date"]

    field_map = {"end_date": "endDate", "commission_rate": "commissionRate", "commission_amount": "commissionAmount"}
    for field, value in update_data.items():
        setattr(placement, field_map.get(field, field), value)

    return {"success": True, "placement": {"id": placement.id, "status": placement.status}}


@router.patch("/{placement_id}")
async def patch_placement(
    placement_id: str,
    body: PlacementUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Placement).where(
            Placement.id == placement_id,
            Placement.organizationId == auth.organization_id,
        )
    )
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")

    old_status = placement.status
    update_data = body.model_dump(exclude_unset=True, exclude={"id"})
    if "end_date" in update_data and update_data["end_date"]:
        try:
            update_data["end_date"] = datetime.fromisoformat(update_data["end_date"])
        except (ValueError, TypeError):
            del update_data["end_date"]

    field_map = {"end_date": "endDate", "commission_rate": "commissionRate", "commission_amount": "commissionAmount"}
    for field, value in update_data.items():
        setattr(placement, field_map.get(field, field), value)

    if old_status != "rejected" and placement.status == "rejected":
        cand_result = await db.execute(
            select(AgencyCandidate).where(AgencyCandidate.id == placement.candidateId)
        )
        candidate = cand_result.scalar_one_or_none()
        if candidate:
            candidate.status = "rejected"

        if placement.jobRequisitionId:
            job_result = await db.execute(
                select(JobRequisition).where(JobRequisition.id == placement.jobRequisitionId)
            )
            job = job_result.scalar_one_or_none()
            if job and job.filledCount > 0:
                job.filledCount -= 1

    elif old_status == "rejected" and placement.status != "rejected":
        cand_result = await db.execute(
            select(AgencyCandidate).where(AgencyCandidate.id == placement.candidateId)
        )
        candidate = cand_result.scalar_one_or_none()
        if candidate:
            candidate.status = "placed"

        if placement.jobRequisitionId:
            job_result = await db.execute(
                select(JobRequisition).where(JobRequisition.id == placement.jobRequisitionId)
            )
            job = job_result.scalar_one_or_none()
            if job:
                job.filledCount = (job.filledCount or 0) + 1

    return {"success": True, "placement": {"id": placement.id, "status": placement.status}}


@router.delete("/{placement_id}")
async def delete_placement(
    placement_id: str,
    auth: AuthUser = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Placement).where(
            Placement.id == placement_id,
            Placement.organizationId == auth.organization_id,
        )
    )
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")

    cand_result = await db.execute(
        select(AgencyCandidate).where(AgencyCandidate.id == placement.candidateId)
    )
    candidate = cand_result.scalar_one_or_none()
    if candidate:
        candidate.status = "offered"

    sub_result = await db.execute(
        select(CandidateSubmission).where(
            CandidateSubmission.candidateId == placement.candidateId,
            CandidateSubmission.jobRequisitionId == placement.jobRequisitionId,
        )
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        sub.status = "offered"

    if placement.jobRequisitionId:
        job_result = await db.execute(
            select(JobRequisition).where(JobRequisition.id == placement.jobRequisitionId)
        )
        job = job_result.scalar_one_or_none()
        if job and job.filledCount > 0:
            job.filledCount -= 1

    await db.delete(placement)
    return {"success": True}
