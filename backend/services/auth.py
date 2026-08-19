import hashlib
import random
import string
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.core import User, Session, TeamMember
from config import SESSION_TTL_HOURS


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_token() -> str:
    chars = string.ascii_letters + string.digits + "-._~"
    return "".join(random.SystemRandom().choices(chars, k=43))


async def create_session(db: AsyncSession, user_id: str, organization_id: str) -> dict:
    token = generate_token()
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS)

    session = Session(
        token_hash=hash_token(token),
        user_id=user_id,
        organization_id=organization_id,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()
    return {"token": token, "expires_at": expires_at}


async def resolve_user_from_token(db: AsyncSession, token: str) -> User | None:
    token_hashed = hash_token(token)
    result = await db.execute(
        select(Session).where(
            Session.token_hash == token_hashed,
            Session.expires_at > datetime.utcnow(),
            Session.revoked_at.is_(None),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        return None

    user_result = await db.execute(select(User).where(User.id == session.user_id))
    return user_result.scalar_one_or_none()


async def get_user_org_role(db: AsyncSession, user_id: str, org_id: str) -> str | None:
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == user_id,
            TeamMember.organization_id == org_id,
            TeamMember.accepted_at.isnot(None),
        )
    )
    membership = result.scalar_one_or_none()
    return membership.role if membership else None
