from __future__ import annotations

from datetime import date

from sqlalchemy import JSON, Date, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class AnalyticsRollup(TenantBase):
    __tablename__ = "analytics_rollups"

    day: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
