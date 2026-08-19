import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    candidateId: Mapped[str] = mapped_column(String, nullable=False)
    jdId: Mapped[str | None] = mapped_column(String, nullable=True)
    organizationId: Mapped[str] = mapped_column(String, nullable=False)
    format: Mapped[str] = mapped_column(String, default="text")
    status: Mapped[str] = mapped_column(String, default="scheduled")
    startedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    durationSeconds: Mapped[int] = mapped_column(Integer, default=0)
    overallScore: Mapped[int] = mapped_column(Integer, default=0)
    aiSummary: Mapped[str | None] = mapped_column(Text, nullable=True)
    aiRecommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    interviewId: Mapped[str] = mapped_column(String, nullable=False)
    questionNumber: Mapped[int] = mapped_column(Integer, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String, default="technical")
    skill: Mapped[str | None] = mapped_column(String, nullable=True)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    timeSpentSeconds: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    aiFeedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
