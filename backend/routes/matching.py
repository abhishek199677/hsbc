from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_role, AuthUser
from models.core import Profile
from models.agency import JobRequisition
from services.embeddings import (
    generate_embedding,
    store_profile_embedding,
    store_job_embedding,
    find_matching_jobs,
    find_matching_candidates,
    profile_to_text,
    job_to_text,
)

router = APIRouter(prefix="/api/match", tags=["matching"])


class MatchRequest(BaseModel):
    action: str
    job_id: str | None = None
    query: str | None = None
    limit: int | None = 10


@router.post("")
async def match_endpoint(
    body: MatchRequest,
    auth: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.action == "index_profile":
        result = await db.execute(select(Profile).where(Profile.userId == auth.user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        text_str = profile_to_text({
            "currentRole": profile.currentRole,
            "totalExperience": profile.totalExperience,
            "skills": profile.skills,
            "aboutYou": profile.aboutYou,
            "education": profile.education,
            "currentCompany": profile.currentCompany,
            "preferredLocation": profile.preferredLocation,
            "jobType": profile.jobType,
        })
        if not text_str.strip():
            raise HTTPException(status_code=400, detail="Profile too sparse for embedding")

        embedding = await generate_embedding(text_str)
        await store_profile_embedding(db, auth.user_id, embedding)
        return {"success": True, "message": "Profile embedding generated", "dimensions": len(embedding)}

    elif body.action == "index_job":
        user = await _require_role(auth, db, ["owner", "admin", "interviewer"])
        if not body.job_id:
            raise HTTPException(status_code=400, detail="job_id required")

        result = await db.execute(
            select(JobRequisition).where(
                JobRequisition.id == body.job_id,
                JobRequisition.organizationId == auth.organization_id,
            )
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        text_str = job_to_text({
            "title": job.title,
            "description": job.description,
            "requiredSkills": job.requirements,
            "location": job.location,
        })
        embedding = await generate_embedding(text_str)
        await store_job_embedding(db, job.id, embedding)
        return {"success": True, "message": "Job embedding generated", "dimensions": len(embedding)}

    elif body.action == "find_jobs":
        match_limit = min(body.limit or 10, 50)
        matches = await find_matching_jobs(db, auth.user_id, auth.organization_id, match_limit)
        return {"success": True, "matches": matches}

    elif body.action == "find_candidates":
        user = await _require_role(auth, db, ["owner", "admin", "interviewer", "viewer"])
        if not body.job_id:
            raise HTTPException(status_code=400, detail="job_id required")

        match_limit = min(body.limit or 10, 50)
        matches = await find_matching_candidates(db, body.job_id, auth.organization_id, match_limit)
        return {"success": True, "matches": matches}

    else:
        raise HTTPException(status_code=400, detail="Invalid action")


async def _require_role(auth: AuthUser, db: AsyncSession, roles: list[str]) -> AuthUser:
    from models.core import TeamMember
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.userId == auth.user_id,
            TeamMember.organizationId == auth.organization_id,
            TeamMember.acceptedAt.isnot(None),
        )
    )
    membership = result.scalar_one_or_none()
    if not membership or membership.role not in roles:
        raise HTTPException(status_code=403, detail="Forbidden")
    return auth
