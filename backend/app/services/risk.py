from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import AssessmentAttempt, AssessmentResult
from app.models.student_success import EngagementEvent, StudentRiskScore


class RiskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compute_risk(self, user_id, institution_id) -> StudentRiskScore:
        now = datetime.now(timezone.utc)
        factors: dict[str, int] = {}

        missed_stmt = select(func.count(AssessmentAttempt.id)).where(
            AssessmentAttempt.user_id == user_id,
            AssessmentAttempt.institution_id == institution_id,
            AssessmentAttempt.status == "in_progress",
            AssessmentAttempt.started_at >= now - timedelta(days=14),
        )
        missed = int((await self.db.execute(missed_stmt)).scalar_one())
        if missed >= 2:
            factors["missed_deadlines"] = missed * 30

        result_stmt = select(func.avg(AssessmentResult.percentage)).where(
            AssessmentResult.user_id == user_id,
            AssessmentResult.institution_id == institution_id,
            AssessmentResult.created_at >= now - timedelta(days=30),
        )
        avg_score = float((await self.db.execute(result_stmt)).scalar_one() or 0)
        if avg_score < 40:
            factors["low_scores"] = 40

        activity_stmt = select(func.max(EngagementEvent.occurred_at)).where(
            EngagementEvent.user_id == user_id,
            EngagementEvent.institution_id == institution_id,
        )
        last_activity = (await self.db.execute(activity_stmt)).scalar_one_or_none()
        if last_activity is None or last_activity < now - timedelta(days=7):
            factors["no_activity"] = 25

        total_score = sum(factors.values())
        if total_score >= 70:
            level = "critical"
        elif total_score >= 45:
            level = "high"
        elif total_score >= 20:
            level = "medium"
        else:
            level = "low"

        risk = StudentRiskScore(
            institution_id=institution_id,
            created_by=user_id,
            user_id=user_id,
            score=total_score,
            level=level,
            factors_json=factors,
            computed_at=now,
        )
        self.db.add(risk)
        await self.db.commit()
        await self.db.refresh(risk)
        return risk

    async def compute_all_users(self, institution_id):
        users_stmt = select(EngagementEvent.user_id).where(EngagementEvent.institution_id == institution_id).distinct()
        user_ids = [row[0] for row in (await self.db.execute(users_stmt)).all()]
        results = []
        for user_id in user_ids:
            results.append(await self.compute_risk(user_id=user_id, institution_id=institution_id))
        return results
