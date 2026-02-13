from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class EngagementEvent(TenantBase):
    __tablename__ = "engagement_events"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    event_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    source: Mapped[str] = mapped_column(String(64), nullable=False, default="app")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)


class StudentRiskScore(TenantBase):
    __tablename__ = "student_risk_scores"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False)
    factors_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AcademicStreak(TenantBase):
    __tablename__ = "academic_streaks"
    __table_args__ = (UniqueConstraint("institution_id", "user_id", "streak_type", name="uq_user_streak_type"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    streak_type: Mapped[str] = mapped_column(String(32), nullable=False)
    current_length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    longest_length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    freeze_used: Mapped[bool] = mapped_column(nullable=False, default=False)


class Badge(TenantBase):
    __tablename__ = "badges"
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_badge_code_per_inst"),)

    code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class UserBadge(TenantBase):
    __tablename__ = "user_badges"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    badge_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("badges.id"), nullable=False, index=True)
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    evidence_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class Intervention(TenantBase):
    __tablename__ = "interventions"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    risk_score_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("student_risk_scores.id"), nullable=True, index=True
    )
    intervention_type: Mapped[str] = mapped_column(String(64), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Quote(TenantBase):
    __tablename__ = "quotes"

    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    active: Mapped[bool] = mapped_column(nullable=False, default=True)
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class UserQuoteHistory(TenantBase):
    __tablename__ = "user_quote_history"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    quote_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("quotes.id"), nullable=False, index=True)
    served_on: Mapped[date] = mapped_column(Date, nullable=False)
