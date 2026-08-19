import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, require_admin_only, AuthUser
from models.agency import ClientJD, Client
from schemas.client_jds import ClientJDCreate, ClientJDUpdate

router = APIRouter(prefix="/api/agency/client-jds", tags=["client-jds"])


@router.get("")
async def list_client_jds(
    clientId: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(ClientJD).where(ClientJD.organizationId == auth.organization_id)
    if clientId:
        query = query.where(ClientJD.clientId == clientId)
    query = query.order_by(ClientJD.createdAt.desc())
    result = await db.execute(query)
    jds = result.scalars().all()

    jd_list = []
    for jd in jds:
        client_result = await db.execute(select(Client).where(Client.id == jd.clientId))
        client = client_result.scalar_one_or_none()
        def _safe_json(val):
            if val is None:
                return []
            if isinstance(val, (list, dict)):
                return val
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return []

        jd_list.append({
            "id": jd.id,
            "clientId": jd.clientId,
            "clientName": client.name if client else "Unknown",
            "organizationId": jd.organizationId,
            "jobTitle": jd.jobTitle,
            "fullJd": jd.fullJd,
            "mustHaveSkills": _safe_json(jd.mustHaveSkills),
            "niceToHaveSkills": _safe_json(jd.niceToHaveSkills),
            "experienceMin": jd.experienceMin,
            "experienceMax": jd.experienceMax,
            "mandatoryRequirements": _safe_json(jd.mandatoryRequirements),
            "domainRequirements": _safe_json(jd.domainRequirements),
            "isDefault": jd.isDefault,
            "createdAt": jd.createdAt.isoformat() if jd.createdAt else None,
            "updatedAt": jd.updatedAt.isoformat() if jd.updatedAt else None,
        })

    return {"success": True, "jds": jd_list}


@router.post("")
async def create_client_jd(
    body: ClientJDCreate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    client_result = await db.execute(
        select(Client).where(
            Client.id == body.clientId,
            Client.organizationId == auth.organization_id,
        )
    )
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    jd = ClientJD(
        clientId=body.clientId,
        organizationId=auth.organization_id,
        jobTitle=body.jobTitle,
        fullJd=body.fullJd,
        mustHaveSkills=json.dumps(body.mustHaveSkills),
        niceToHaveSkills=json.dumps(body.niceToHaveSkills),
        experienceMin=body.experienceMin,
        experienceMax=body.experienceMax,
        mandatoryRequirements=json.dumps(body.mandatoryRequirements),
        domainRequirements=json.dumps(body.domainRequirements),
        isDefault=body.isDefault,
    )
    db.add(jd)
    await db.flush()

    return {"success": True, "jd": {"id": jd.id, "jobTitle": jd.jobTitle}}


@router.put("")
async def update_client_jd(
    body: ClientJDUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientJD).where(
            ClientJD.id == body.id,
            ClientJD.organizationId == auth.organization_id,
        )
    )
    jd = result.scalar_one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    if body.jobTitle is not None:
        jd.jobTitle = body.jobTitle
    if body.fullJd is not None:
        jd.fullJd = body.fullJd
    if body.mustHaveSkills is not None:
        jd.mustHaveSkills = json.dumps(body.mustHaveSkills)
    if body.niceToHaveSkills is not None:
        jd.niceToHaveSkills = json.dumps(body.niceToHaveSkills)
    if body.experienceMin is not None:
        jd.experienceMin = body.experienceMin
    if body.experienceMax is not None:
        jd.experienceMax = body.experienceMax
    if body.mandatoryRequirements is not None:
        jd.mandatoryRequirements = json.dumps(body.mandatoryRequirements)
    if body.domainRequirements is not None:
        jd.domainRequirements = json.dumps(body.domainRequirements)
    if body.isDefault is not None:
        jd.isDefault = body.isDefault

    return {"success": True, "jd": {"id": jd.id, "jobTitle": jd.jobTitle}}


@router.delete("")
async def delete_client_jd(
    id: str = Query(...),
    auth: AuthUser = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientJD).where(
            ClientJD.id == id,
            ClientJD.organizationId == auth.organization_id,
        )
    )
    jd = result.scalar_one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    await db.delete(jd)
    return {"success": True}
