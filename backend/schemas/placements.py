from pydantic import BaseModel


class PlacementCreate(BaseModel):
    candidateId: str
    clientId: str
    jobRequisitionId: str | None = None
    startDate: str
    salary: int | None = None
    commissionRate: float | None = None
    notes: str | None = None


class PlacementUpdate(BaseModel):
    id: str
    status: str | None = None
    endDate: str | None = None
    notes: str | None = None
    commissionRate: float | None = None
    commissionAmount: float | None = None
