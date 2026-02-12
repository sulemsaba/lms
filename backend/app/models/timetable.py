from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class Venue(TenantBase):
    __tablename__ = "venues"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    campus: Mapped[str] = mapped_column(String(120), nullable=False)
    building: Mapped[str | None] = mapped_column(String(120), nullable=True)
    floor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gps_lat: Mapped[float] = mapped_column(Float, nullable=False)
    gps_lng: Mapped[float] = mapped_column(Float, nullable=False)
    accessibility_features: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class VenueAlias(TenantBase):
    __tablename__ = "venue_aliases"

    venue_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("venues.id"), nullable=False, index=True)
    alias: Mapped[str] = mapped_column(String(255), nullable=False)


class TimetableEvent(TenantBase):
    __tablename__ = "timetable_events"

    course_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=True, index=True)
    venue_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("venues.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, default="lecture")
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    recurring_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RouteCache(TenantBase):
    __tablename__ = "routes_cache"

    from_venue_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("venues.id"), nullable=False, index=True)
    to_venue_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("venues.id"), nullable=False, index=True)
    polyline: Mapped[str] = mapped_column(Text, nullable=False)
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    travel_mode: Mapped[str] = mapped_column(String(50), nullable=False, default="walk")
