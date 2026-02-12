from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AssessmentCreate(BaseModel):
    course_id: UUID
    module_id: UUID | None = None
    title: str
    assessment_type: str = "assignment"
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    max_score: float = 100


class AssessmentUpdate(BaseModel):
    title: str | None = None
    assessment_status: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class AssessmentRead(BaseModel):
    id: UUID
    institution_id: UUID
    course_id: UUID
    module_id: UUID | None
    title: str
    assessment_type: str
    assessment_status: str
    starts_at: datetime | None
    ends_at: datetime | None
    max_score: float

    model_config = {"from_attributes": True}
