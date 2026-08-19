from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    industry: str | None = None
    website: str | None = None
    contactName: str | None = None
    contactEmail: str | None = None
    contactPhone: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    id: str
    name: str | None = None
    industry: str | None = None
    website: str | None = None
    contactName: str | None = None
    contactEmail: str | None = None
    contactPhone: str | None = None
    address: str | None = None
    notes: str | None = None
    status: str | None = None
