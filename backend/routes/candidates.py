import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, require_admin_only, AuthUser
from models.agency import AgencyCandidate, CandidateSubmission, Placement
from schemas.candidates import CandidateCreate, CandidateUpdate
from resume_parser import extract_text

router = APIRouter(prefix="/api/agency/candidates", tags=["candidates"])


@router.get("")
async def list_candidates(
    status: str | None = Query(None),
    source: str | None = Query(None),
    search: str | None = Query(None),
    skills: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(AgencyCandidate).where(AgencyCandidate.organizationId == auth.organization_id)
    if status and status != "all":
        query = query.where(AgencyCandidate.status == status)
    if source and source != "all":
        query = query.where(AgencyCandidate.source == source)
    if search:
        sf = f"%{search}%"
        query = query.where(
            AgencyCandidate.name.ilike(sf)
            | AgencyCandidate.email.ilike(sf)
            | AgencyCandidate.currentRole.ilike(sf)
            | AgencyCandidate.currentCompany.ilike(sf)
            | AgencyCandidate.location.ilike(sf)
        )
    if skills:
        query = query.where(AgencyCandidate.skills.ilike(f"%{skills}%"))
    query = query.order_by(AgencyCandidate.createdAt.desc())
    result = await db.execute(query)
    candidates = result.scalars().all()

    candidate_list = []
    for c in candidates:
        sub_count = await db.execute(
            select(func.count()).select_from(CandidateSubmission).where(CandidateSubmission.candidateId == c.id)
        )
        pl_count = await db.execute(
            select(func.count()).select_from(Placement).where(Placement.candidateId == c.id)
        )
        candidate_list.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "source": c.source,
            "naukriId": c.naukriId,
            "linkedinUrl": c.linkedinUrl,
            "resumeUrl": c.resumeUrl,
            "currentRole": c.currentRole,
            "currentCompany": c.currentCompany,
            "totalExperience": c.totalExperience,
            "skills": c.skills,
            "location": c.location,
            "expectedSalary": c.expectedSalary,
            "noticePeriod": c.noticePeriod,
            "status": c.status,
            "notes": c.notes,
            "rating": c.rating,
            "createdAt": c.createdAt.isoformat() if c.createdAt else None,
            "_count": {
                "submissions": sub_count.scalar() or 0,
                "placements": pl_count.scalar() or 0,
            },
        })

    return {"success": True, "candidates": candidate_list}


@router.post("")
async def create_candidate(
    body: CandidateCreate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    normalized_email = body.email.strip().lower() if body.email else None

    existing = None
    if normalized_email:
        result = await db.execute(
            select(AgencyCandidate).where(
                AgencyCandidate.organizationId == auth.organization_id,
                AgencyCandidate.email == normalized_email,
            )
        )
        existing = result.scalar_one_or_none()
    if not existing and body.naukriId:
        result = await db.execute(
            select(AgencyCandidate).where(
                AgencyCandidate.organizationId == auth.organization_id,
                AgencyCandidate.naukriId == body.naukriId,
            )
        )
        existing = result.scalar_one_or_none()

    if existing:
        for field, value in body.model_dump(exclude_unset=True, exclude={"id"}).items():
            if value is not None:
                setattr(existing, field, value)
        return {"success": True, "candidate": {"id": existing.id, "name": existing.name}}

    candidate = AgencyCandidate(
        organizationId=auth.organization_id,
        name=body.name,
        email=normalized_email,
        phone=body.phone,
        source=body.source or "manual",
        naukriId=body.naukriId,
        linkedinUrl=body.linkedinUrl,
        resumeUrl=body.resumeUrl,
        currentRole=body.currentRole,
        currentCompany=body.currentCompany,
        totalExperience=body.totalExperience,
        skills=body.skills,
        location=body.location,
        expectedSalary=body.expectedSalary,
        noticePeriod=body.noticePeriod,
        notes=body.notes,
        rating=body.rating,
    )
    db.add(candidate)
    await db.flush()

    return {"success": True, "candidate": {"id": candidate.id, "name": candidate.name}}


@router.post("/import")
async def import_candidates(
    files: list[UploadFile] = File(...),
    source: str = Form("resume"),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="Select at least one resume")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 resumes at once")

    allowed = {".pdf", ".docx"}
    created = []
    failed = []

    for file in files:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in allowed:
            failed.append({"filename": file.filename, "error": "Only PDF and DOCX supported"})
            continue

        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            failed.append({"filename": file.filename, "error": "Exceeds 5MB limit"})
            continue

        try:
            resume_text = extract_text(file_bytes, file.filename or "resume.txt")
            if not resume_text or len(resume_text.strip()) < 50:
                failed.append({"filename": file.filename, "error": "Could not extract text"})
                continue

            ai_result = await _parse_resume_ai(resume_text)
            name = ai_result.get("name")
            if not name:
                failed.append({"filename": file.filename, "error": "No name found in resume"})
                continue

            normalized_email = ai_result.get("email", "").strip().lower() or None
            existing = None
            if normalized_email:
                result = await db.execute(
                    select(AgencyCandidate).where(
                        AgencyCandidate.organizationId == auth.organization_id,
                        AgencyCandidate.email == normalized_email,
                    )
                )
                existing = result.scalar_one_or_none()

            candidate_data = {
                "name": name,
                "email": normalized_email,
                "phone": ai_result.get("phone"),
                "source": source,
                "currentRole": ai_result.get("currentRole"),
                "currentCompany": ai_result.get("currentCompany"),
                "totalExperience": ai_result.get("totalExperience"),
                "skills": ", ".join(ai_result.get("skills", [])) if ai_result.get("skills") else None,
                "location": ai_result.get("currentLocation"),
                "notes": ai_result.get("summary"),
            }

            if existing:
                for field, value in candidate_data.items():
                    if value:
                        setattr(existing, field, value)
                created.append({"id": existing.id, "name": existing.name})
            else:
                candidate = AgencyCandidate(
                    organizationId=auth.organization_id,
                    **candidate_data,
                )
                db.add(candidate)
                await db.flush()
                created.append({"id": candidate.id, "name": candidate.name})

        except Exception as e:
            failed.append({"filename": file.filename, "error": str(e)})

    return {
        "success": len(created) > 0,
        "candidates": created,
        "count": len(created),
        "failed": failed,
    }


@router.put("")
async def update_candidate(
    body: CandidateUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgencyCandidate).where(
            AgencyCandidate.id == body.id,
            AgencyCandidate.organizationId == auth.organization_id,
        )
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"id"})
    for field, value in update_data.items():
        setattr(candidate, field, value)

    return {"success": True, "candidate": {"id": candidate.id, "name": candidate.name}}


@router.delete("")
async def delete_candidate(
    id: str = Query(...),
    auth: AuthUser = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgencyCandidate).where(
            AgencyCandidate.id == id,
            AgencyCandidate.organizationId == auth.organization_id,
        )
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    await db.delete(candidate)
    return {"success": True}


async def _parse_resume_ai(text: str) -> dict:
    import os
    from openai import OpenAI
    from dotenv import load_dotenv

    load_dotenv()
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract structured info from resume. Return JSON with: "
                    "name, email, phone, currentRole, totalExperience, currentLocation, "
                    "skills (array), education, currentCompany, summary, strengths. "
                    "Use null for missing fields."
                ),
            },
            {"role": "user", "content": f"Parse this resume:\n\n{text[:8000]}"},
        ],
        temperature=0.1,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    import json
    content = response.choices[0].message.content or "{}"
    return json.loads(content)
