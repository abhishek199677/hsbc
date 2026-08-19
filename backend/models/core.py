import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Organization(Base):
    __tablename__ = "Organization"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True)
    logoUrl: Mapped[str | None] = mapped_column(String, nullable=True)
    primaryColor: Mapped[str] = mapped_column(String, default="#4f46e5")
    accentColor: Mapped[str] = mapped_column(String, default="#7c3aed")
    isGovernment: Mapped[bool] = mapped_column(Boolean, default=False)
    plan: Mapped[str] = mapped_column(String, default="starter")
    planStatus: Mapped[str | None] = mapped_column(String, nullable=True)
    trialEndsAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    stripeCustomerId: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    stripeSubscriptionId: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    stripePriceId: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    onboardingCompleted: Mapped[bool] = mapped_column(Boolean, default=False)
    onboardingStep: Mapped[int] = mapped_column(default=0)
    ssoEnabled: Mapped[bool] = mapped_column(Boolean, default=False)
    enforceSso: Mapped[bool] = mapped_column(Boolean, default=False)
    ipWhitelist: Mapped[str | None] = mapped_column(String, nullable=True)
    sessionTimeoutMinutes: Mapped[int] = mapped_column(default=480)
    maxUsers: Mapped[int | None] = mapped_column(nullable=True)
    dataRegion: Mapped[str | None] = mapped_column(String, default="us")
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String, unique=True)
    password: Mapped[str] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="jobseeker")
    emailVerifiedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    twoFactorEnabled: Mapped[bool] = mapped_column(Boolean, default=False)
    twoFactorSecret: Mapped[str | None] = mapped_column(String, nullable=True)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class TeamMember(Base):
    __tablename__ = "TeamMember"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    userId: Mapped[str] = mapped_column(String, nullable=False)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="member")
    inviteToken: Mapped[str | None] = mapped_column(String, nullable=True)
    inviteExpiresAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    invitedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    acceptedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Session(Base):
    __tablename__ = "Session"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tokenHash: Mapped[str] = mapped_column(String, unique=True)
    userId: Mapped[str] = mapped_column(String, nullable=False)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    expiresAt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revokedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Profile(Base):
    __tablename__ = "Profile"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    userId: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    resumeUrl: Mapped[str | None] = mapped_column(String, nullable=True)
    resumeFileName: Mapped[str | None] = mapped_column(String, nullable=True)
    aboutYou: Mapped[str | None] = mapped_column(String, nullable=True)
    whatDrivesYou: Mapped[str | None] = mapped_column(String, nullable=True)
    strengths: Mapped[str | None] = mapped_column(String, nullable=True)
    currentRole: Mapped[str | None] = mapped_column(String, nullable=True)
    totalExperience: Mapped[str | None] = mapped_column(String, nullable=True)
    currentLocation: Mapped[str | None] = mapped_column(String, nullable=True)
    noticePeriod: Mapped[str | None] = mapped_column(String, nullable=True)
    skills: Mapped[str | None] = mapped_column(String, nullable=True)
    currentCompany: Mapped[str | None] = mapped_column(String, nullable=True)
    education: Mapped[str | None] = mapped_column(String, nullable=True)
    jobType: Mapped[str | None] = mapped_column(String, nullable=True)
    salaryRange: Mapped[str | None] = mapped_column(String, nullable=True)
    preferredLocation: Mapped[str | None] = mapped_column(String, nullable=True)
    workMode: Mapped[str | None] = mapped_column(String, nullable=True)
    preferredDate: Mapped[str | None] = mapped_column(String, nullable=True)
    preferredTimeSlot: Mapped[str | None] = mapped_column(String, nullable=True)
    timezone: Mapped[str] = mapped_column(String, default="Asia/Kolkata")
    step: Mapped[int] = mapped_column(default=1)
    isComplete: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
