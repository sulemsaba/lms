from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AnalyticsEventCreate(BaseModel):
    event_type: str
    event_value: float = 1.0
    source: str = "app"
    metadata: dict = {}


class RiskRead(BaseModel):
    score: int
    level: str
    factors_json: dict
    computed_at: datetime


class DashboardResponse(BaseModel):
    user_id: UUID
    risk: RiskRead | None
    streaks: dict
    badges: list[dict]
    skills: list[dict]
