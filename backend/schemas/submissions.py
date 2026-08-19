from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    candidateId: str
    jobRequisitionId: str


class SubmissionUpdate(BaseModel):
    id: str
    status: str | None = None
    feedback: str | None = None
    interviewDate: str | None = None
