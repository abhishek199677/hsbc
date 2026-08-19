from pydantic import BaseModel


class JobCreate(BaseModel):
    clientId: str
    title: str
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    jobType: str | None = "full-time"
    salaryMin: int | None = None
    salaryMax: int | None = None
    experienceMin: int | None = None
    experienceMax: int | None = None
    priority: str | None = "normal"
    openings: int | None = 1
    deadline: str | None = None
    notes: str | None = None


class JobUpdate(BaseModel):
    id: str
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    jobType: str | None = None
    salaryMin: int | None = None
    salaryMax: int | None = None
    experienceMin: int | None = None
    experienceMax: int | None = None
    status: str | None = None
    priority: str | None = None
    openings: int | None = None
    deadline: str | None = None
    notes: str | None = None
