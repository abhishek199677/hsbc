import hashlib
from dataclasses import dataclass
from datetime import datetime

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.core import User, Session, TeamMember
from config import SESSION_COOKIE


@dataclass
class AuthUser:
    session_id: str
    user_id: str
    email: str
    organization_id: str


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()

    cookie_header = request.headers.get("cookie", "")
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith(f"{SESSION_COOKIE}="):
            return part[len(SESSION_COOKIE) + 1:]
    return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    token_hashed = hash_token(token)
    result = await db.execute(
        select(Session).where(
            Session.tokenHash == token_hashed,
            Session.expiresAt > datetime.utcnow(),
            Session.revokedAt.is_(None),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_result = await db.execute(select(User).where(User.id == session.userId))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return AuthUser(
        session_id=session.id,
        user_id=user.id,
        email=user.email,
        organization_id=session.organizationId,
    )


async def require_admin_or_employer(
    auth: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    result = await db.execute(select(User).where(User.id == auth.user_id))
    user = result.scalar_one_or_none()
    if not user or user.role not in ("admin", "employer"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return auth


async def require_admin_only(
    auth: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    result = await db.execute(select(User).where(User.id == auth.user_id))
    user = result.scalar_one_or_none()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return auth


async def require_org_role(
    request: Request,
    allowed_roles: list[str],
    auth: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.userId == auth.user_id,
            TeamMember.organizationId == auth.organization_id,
            TeamMember.acceptedAt.isnot(None),
        )
    )
    membership = result.scalar_one_or_none()
    if not membership or membership.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Forbidden")
    return auth
