import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Integer, Float, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    website: Mapped[str | None] = mapped_column(String, nullable=True)
    contactName: Mapped[str | None] = mapped_column(String, nullable=True)
    contactEmail: Mapped[str | None] = mapped_column(String, nullable=True)
    contactPhone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    clientId: Mapped[str] = mapped_column(String, nullable=False)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    jobType: Mapped[str] = mapped_column(String, default="full-time")
    salaryMin: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salaryMax: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experienceMin: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experienceMax: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open")
    priority: Mapped[str] = mapped_column(String, default="normal")
    openings: Mapped[int] = mapped_column(Integer, default=1)
    filledCount: Mapped[int] = mapped_column(Integer, default=0)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class AgencyCandidate(Base):
    __tablename__ = "agency_candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual")
    naukriId: Mapped[str | None] = mapped_column(String, nullable=True)
    linkedinUrl: Mapped[str | None] = mapped_column(String, nullable=True)
    resumeUrl: Mapped[str | None] = mapped_column(String, nullable=True)
    currentRole: Mapped[str | None] = mapped_column(String, nullable=True)
    currentCompany: Mapped[str | None] = mapped_column(String, nullable=True)
    totalExperience: Mapped[str | None] = mapped_column(String, nullable=True)
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    expectedSalary: Mapped[int | None] = mapped_column(Integer, nullable=True)
    noticePeriod: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="sourced")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class CandidateSubmission(Base):
    __tablename__ = "candidate_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    candidateId: Mapped[str] = mapped_column(String, nullable=False)
    jobRequisitionId: Mapped[str] = mapped_column(String, nullable=False)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="submitted")
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    interviewDate: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Placement(Base):
    __tablename__ = "placements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    candidateId: Mapped[str] = mapped_column(String, nullable=False)
    clientId: Mapped[str] = mapped_column(String, nullable=False)
    jobRequisitionId: Mapped[str | None] = mapped_column(String, nullable=True)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    startDate: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    endDate: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    salary: Mapped[int | None] = mapped_column(Integer, nullable=True)
    commissionRate: Mapped[float | None] = mapped_column(Float, nullable=True)
    commissionAmount: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ClientJD(Base):
    __tablename__ = "client_jds"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    clientId: Mapped[str] = mapped_column(String, nullable=False)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    jobTitle: Mapped[str] = mapped_column(String, nullable=False)
    fullJd: Mapped[str] = mapped_column(Text, nullable=False)
    mustHaveSkills: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    niceToHaveSkills: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    experienceMin: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experienceMax: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mandatoryRequirements: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    domainRequirements: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    isDefault: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
