from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import (
    AssessmentAttempt,
    AssessmentQuestionOption,
    AssessmentResponse,
    AssessmentResult,
)


class GradingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def grade_attempt(self, attempt_id):
        attempt_stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
        attempt = (await self.db.execute(attempt_stmt)).scalar_one_or_none()
        if attempt is None:
            raise ValueError("attempt not found")

        score_stmt = (
            select(func.count(AssessmentResponse.id))
            .join(AssessmentQuestionOption, AssessmentQuestionOption.id == AssessmentResponse.selected_option_id)
            .where(
                AssessmentResponse.attempt_id == attempt_id,
                AssessmentQuestionOption.is_correct.is_(True),
            )
        )
        score = int((await self.db.execute(score_stmt)).scalar_one())

        total_stmt = select(func.count(AssessmentResponse.id)).where(AssessmentResponse.attempt_id == attempt_id)
        total = int((await self.db.execute(total_stmt)).scalar_one())
        percentage = (score / total * 100) if total else 0

        result = AssessmentResult(
            institution_id=attempt.institution_id,
            created_by=attempt.user_id,
            attempt_id=attempt.id,
            user_id=attempt.user_id,
            total_score=float(score),
            percentage=float(percentage),
        )
        self.db.add(result)
        await self.db.commit()
        await self.db.refresh(result)
        return result
