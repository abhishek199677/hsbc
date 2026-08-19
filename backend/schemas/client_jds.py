from pydantic import BaseModel


class ClientJDCreate(BaseModel):
    clientId: str
    jobTitle: str
    fullJd: str
    mustHaveSkills: list[str] = []
    niceToHaveSkills: list[str] = []
    experienceMin: int | None = None
    experienceMax: int | None = None
    mandatoryRequirements: list[str] = []
    domainRequirements: list[str] = []
    isDefault: bool = False


class ClientJDUpdate(BaseModel):
    id: str
    jobTitle: str | None = None
    fullJd: str | None = None
    mustHaveSkills: list[str] | None = None
    niceToHaveSkills: list[str] | None = None
    experienceMin: int | None = None
    experienceMax: int | None = None
    mandatoryRequirements: list[str] | None = None
    domainRequirements: list[str] | None = None
    isDefault: bool | None = None
