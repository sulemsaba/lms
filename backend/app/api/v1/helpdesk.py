from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.helpdesk import Ticket
from app.models.iam import User
from app.schemas.ticket import TicketCreate, TicketRead

router = APIRouter()


@router.get("/tickets", response_model=list[TicketRead])
async def list_tickets(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("helpdesk.read.own")),
):
    stmt = select(Ticket).where(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/tickets", response_model=TicketRead)
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("helpdesk.create")),
):
    ticket = Ticket(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        status="open",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket
