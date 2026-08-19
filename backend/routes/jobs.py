from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, require_admin_only, AuthUser
from models.agency import JobRequisition, Client
from schemas.jobs import JobCreate, JobUpdate

router = APIRouter(prefix="/api/agency/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    status: str | None = Query(None),
    client_id: str | None = Query(None),
    priority: str | None = Query(None),
    search: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(JobRequisition).where(JobRequisition.organizationId == auth.organization_id)
    if status and status != "all":
        query = query.where(JobRequisition.status == status)
    if client_id:
        query = query.where(JobRequisition.clientId == client_id)
    if priority and priority != "all":
        query = query.where(JobRequisition.priority == priority)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            JobRequisition.title.ilike(search_filter)
            | JobRequisition.description.ilike(search_filter)
            | JobRequisition.location.ilike(search_filter)
        )
    query = query.order_by(JobRequisition.priority.desc(), JobRequisition.createdAt.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    job_list = []
    for j in jobs:
        client_result = await db.execute(select(Client).where(Client.id == j.clientId))
        client = client_result.scalar_one_or_none()

        cand_count = await db.execute(
            select(func.count()).select_from(JobRequisition).where(JobRequisition.id == j.id)
        )

        job_list.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "requirements": j.requirements,
            "location": j.location,
            "jobType": j.jobType,
            "salaryMin": j.salaryMin,
            "salaryMax": j.salaryMax,
            "experienceMin": j.experienceMin,
            "experienceMax": j.experienceMax,
            "status": j.status,
            "priority": j.priority,
            "openings": j.openings,
            "filledCount": j.filledCount,
            "deadline": j.deadline.isoformat() if j.deadline else None,
            "notes": j.notes,
            "createdAt": j.createdAt.isoformat() if j.createdAt else None,
            "client": {
                "id": client.id,
                "name": client.name,
                "industry": client.industry,
            } if client else None,
            "_count": {
                "candidates": cand_count.scalar() or 0,
                "placements": 0,
            },
        })

    return {"success": True, "jobs": job_list}


@router.post("")
async def create_job(
    body: JobCreate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    client_result = await db.execute(
        select(Client).where(Client.id == body.client_id, Client.organizationId == auth.organization_id)
    )
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    deadline = None
    if body.deadline:
        try:
            deadline = datetime.fromisoformat(body.deadline)
        except ValueError:
            pass

    job = JobRequisition(
        clientId=body.client_id,
        organizationId=auth.organization_id,
        title=body.title,
        description=body.description,
        requirements=body.requirements,
        location=body.location,
        jobType=body.job_type or "full-time",
        salaryMin=body.salary_min,
        salaryMax=body.salary_max,
        experienceMin=body.experience_min,
        experienceMax=body.experience_max,
        priority=body.priority or "normal",
        openings=body.openings or 1,
        deadline=deadline,
        notes=body.notes,
    )
    db.add(job)
    await db.flush()

    return {
        "success": True,
        "job": {
            "id": job.id,
            "title": job.title,
            "client": {"name": client.name},
            "createdAt": job.createdAt.isoformat() if job.createdAt else None,
        },
    }


@router.put("")
async def update_job(
    body: JobUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobRequisition).where(
            JobRequisition.id == body.id,
            JobRequisition.organizationId == auth.organization_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"id"})
    if "deadline" in update_data and update_data["deadline"]:
        try:
            update_data["deadline"] = datetime.fromisoformat(update_data["deadline"])
        except (ValueError, TypeError):
            del update_data["deadline"]

    field_map = {"client_id": "clientId", "job_type": "jobType", "salary_min": "salaryMin", "salary_max": "salaryMax", "experience_min": "experienceMin", "experience_max": "experienceMax"}
    for field, value in update_data.items():
        setattr(job, field_map.get(field, field), value)

    return {"success": True, "job": {"id": job.id, "title": job.title}}


@router.delete("")
async def delete_job(
    id: str = Query(...),
    auth: AuthUser = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobRequisition).where(
            JobRequisition.id == id,
            JobRequisition.organizationId == auth.organization_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.delete(job)
    return {"success": True}
