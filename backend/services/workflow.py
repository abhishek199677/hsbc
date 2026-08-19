from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.agency import CandidateSubmission


VALID_TRANSITIONS: dict[str, list[str]] = {
    "submitted": ["shortlisted", "rejected"],
    "screening": ["shortlisted", "rejected"],
    "shortlisted": ["interview-scheduled", "rejected"],
    "interview-scheduled": ["offered", "rejected"],
    "offered": ["placed", "rejected"],
    "placed": [],
    "rejected": [],
}


def can_transition(current: str, next_stage: str) -> bool:
    return next_stage in VALID_TRANSITIONS.get(current, [])


def next_stage(current: str) -> str | None:
    transitions = VALID_TRANSITIONS.get(current, [])
    for s in transitions:
        if s != "rejected":
            return s
    return None


def stage_label(stage: str) -> str:
    if stage == "submitted":
        return "Screening"
    return stage.replace("-", " ").title()


async def get_submission(db: AsyncSession, submission_id: str, org_id: str) -> CandidateSubmission | None:
    result = await db.execute(
        select(CandidateSubmission).where(
            CandidateSubmission.id == submission_id,
            CandidateSubmission.organization_id == org_id,
        )
    )
    return result.scalar_one_or_none()
