from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AssessmentAttemptCreate(BaseModel):
    assessment_id: UUID


class AssessmentResponseCreate(BaseModel):
    question_id: UUID
    selected_option_id: UUID | None = None
    answer_text: str | None = None


class SubmitAttemptRequest(BaseModel):
    idempotency_key: str


class AssessmentAttemptRead(BaseModel):
    id: UUID
    assessment_id: UUID
    user_id: UUID
    status: str
    started_at: datetime
    submitted_at: datetime | None

    model_config = {"from_attributes": True}


class AssessmentResultRead(BaseModel):
    id: UUID
    attempt_id: UUID
    user_id: UUID
    total_score: float
    percentage: float
    version: int

    model_config = {"from_attributes": True}
