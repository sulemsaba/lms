from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.iam import User
from app.models.timetable import Venue
from app.schemas.venue import RouteResponse, VenueRead
from app.services.venue import VenueService

router = APIRouter()


@router.get("/", response_model=list[VenueRead])
async def list_venues(
    campus: str | None = Query(default=None),
    building: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("map.read")),
) -> list[VenueRead]:
    stmt = select(Venue).where(Venue.deleted_at.is_(None))
    if campus:
        stmt = stmt.where(Venue.campus == campus)
    if building:
        stmt = stmt.where(Venue.building == building)
    return (await db.execute(stmt)).scalars().all()


@router.get("/search", response_model=list[VenueRead])
async def search_venues(
    q: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("map.read")),
):
    return await VenueService(db).search(current_user.institution_id, q)


@router.get("/{venue_id}/route", response_model=RouteResponse)
async def get_route(
    venue_id: UUID,
    to: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("map.read")),
):
    route = await VenueService(db).get_route(current_user.institution_id, venue_id, to)
    return RouteResponse(
        from_venue_id=route.from_venue_id,
        to_venue_id=route.to_venue_id,
        polyline=route.polyline,
        distance_m=route.distance_m,
        duration_sec=route.duration_sec,
        travel_mode=route.travel_mode,
    )


@router.get("/nearby", response_model=list[VenueRead])
async def nearby_venues(
    lat: float,
    lng: float,
    radius: float = 300,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("map.read")),
):
    return await VenueService(db).nearby(current_user.institution_id, lat, lng, radius)
