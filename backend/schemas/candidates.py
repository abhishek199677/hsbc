from pydantic import BaseModel


class CandidateCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = "manual"
    naukriId: str | None = None
    linkedinUrl: str | None = None
    resumeUrl: str | None = None
    currentRole: str | None = None
    currentCompany: str | None = None
    totalExperience: str | None = None
    skills: str | None = None
    location: str | None = None
    expectedSalary: int | None = None
    noticePeriod: str | None = None
    notes: str | None = None
    rating: int | None = None


class CandidateUpdate(BaseModel):
    id: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    naukriId: str | None = None
    linkedinUrl: str | None = None
    resumeUrl: str | None = None
    currentRole: str | None = None
    currentCompany: str | None = None
    totalExperience: str | None = None
    skills: str | None = None
    location: str | None = None
    expectedSalary: int | None = None
    noticePeriod: str | None = None
    notes: str | None = None
    rating: int | None = None
    status: str | None = None
