from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, require_admin_only, AuthUser
from models.agency import Client, JobRequisition, Placement
from schemas.clients import ClientCreate, ClientUpdate

router = APIRouter(prefix="/api/agency/clients", tags=["clients"])


@router.get("")
async def list_clients(
    status: str | None = Query(None),
    search: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Client).where(Client.organizationId == auth.organization_id)
    if status and status != "all":
        query = query.where(Client.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            Client.name.ilike(search_filter)
            | Client.industry.ilike(search_filter)
            | Client.contactName.ilike(search_filter)
            | Client.contactEmail.ilike(search_filter)
        )
    query = query.order_by(Client.createdAt.desc())
    result = await db.execute(query)
    clients = result.scalars().all()

    client_list = []
    for c in clients:
        jr_count = await db.execute(
            select(func.count()).select_from(JobRequisition).where(JobRequisition.clientId == c.id)
        )
        pl_count = await db.execute(
            select(func.count()).select_from(Placement).where(Placement.clientId == c.id)
        )
        client_list.append({
            "id": c.id,
            "name": c.name,
            "industry": c.industry,
            "website": c.website,
            "contactName": c.contactName,
            "contactEmail": c.contactEmail,
            "contactPhone": c.contactPhone,
            "address": c.address,
            "notes": c.notes,
            "status": c.status,
            "createdAt": c.createdAt.isoformat() if c.createdAt else None,
            "_count": {
                "jobRequisitions": jr_count.scalar() or 0,
                "placements": pl_count.scalar() or 0,
            },
        })

    return {"success": True, "clients": client_list}


@router.post("")
async def create_client(
    body: ClientCreate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    client = Client(
        organizationId=auth.organization_id,
        name=body.name,
        industry=body.industry,
        website=body.website,
        contactName=body.contact_name,
        contactEmail=body.contact_email,
        contactPhone=body.contact_phone,
        address=body.address,
        notes=body.notes,
    )
    db.add(client)
    await db.flush()

    return {
        "success": True,
        "client": {
            "id": client.id,
            "name": client.name,
            "industry": client.industry,
            "website": client.website,
            "contactName": client.contactName,
            "contactEmail": client.contactEmail,
            "contactPhone": client.contactPhone,
            "address": client.address,
            "notes": client.notes,
            "status": client.status,
            "createdAt": client.createdAt.isoformat() if client.createdAt else None,
        },
    }


@router.put("")
async def update_client(
    body: ClientUpdate,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(Client.id == body.id, Client.organizationId == auth.organization_id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"id"})
    field_map = {"contact_name": "contactName", "contact_email": "contactEmail", "contact_phone": "contactPhone"}
    for field, value in update_data.items():
        setattr(client, field_map.get(field, field), value)

    return {"success": True, "client": {"id": client.id, "name": client.name}}


@router.delete("")
async def delete_client(
    id: str = Query(...),
    auth: AuthUser = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(Client.id == id, Client.organizationId == auth.organization_id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await db.delete(client)
    return {"success": True}
