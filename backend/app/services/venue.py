from __future__ import annotations

from math import sqrt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.timetable import RouteCache, Venue


class VenueService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(self, institution_id, query: str):
        stmt = select(Venue).where(
            Venue.institution_id == institution_id,
            Venue.name.ilike(f"%{query}%"),
            Venue.deleted_at.is_(None),
        )
        return (await self.db.execute(stmt)).scalars().all()

    async def nearby(self, institution_id, lat: float, lng: float, radius: float):
        stmt = select(Venue).where(Venue.institution_id == institution_id, Venue.deleted_at.is_(None))
        venues = (await self.db.execute(stmt)).scalars().all()

        def distance(v: Venue) -> float:
            return sqrt((v.gps_lat - lat) ** 2 + (v.gps_lng - lng) ** 2) * 111000

        return [v for v in venues if distance(v) <= radius]

    async def get_route(self, institution_id, from_venue_id, to_venue_id):
        stmt = select(RouteCache).where(
            RouteCache.institution_id == institution_id,
            RouteCache.from_venue_id == from_venue_id,
            RouteCache.to_venue_id == to_venue_id,
        )
        route = (await self.db.execute(stmt)).scalar_one_or_none()
        if route is not None:
            return route

        route = RouteCache(
            institution_id=institution_id,
            from_venue_id=from_venue_id,
            to_venue_id=to_venue_id,
            polyline="[[0,0],[1,1]]",
            distance_m=350,
            duration_sec=260,
            travel_mode="walk",
        )
        self.db.add(route)
        await self.db.commit()
        await self.db.refresh(route)
        return route
