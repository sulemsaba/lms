from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_success import AcademicStreak


class StreakService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mark_activity(self, user_id, institution_id, streak_type: str, activity_date: date | None = None):
        today = activity_date or date.today()
        stmt = select(AcademicStreak).where(
            AcademicStreak.user_id == user_id,
            AcademicStreak.institution_id == institution_id,
            AcademicStreak.streak_type == streak_type,
        )
        streak = (await self.db.execute(stmt)).scalar_one_or_none()
        if streak is None:
            streak = AcademicStreak(
                institution_id=institution_id,
                created_by=user_id,
                user_id=user_id,
                streak_type=streak_type,
                current_length=1,
                longest_length=1,
                last_activity_date=today,
            )
            self.db.add(streak)
        else:
            if streak.last_activity_date == today:
                return streak
            if streak.last_activity_date == today - timedelta(days=1):
                streak.current_length += 1
            else:
                streak.current_length = 1
            streak.longest_length = max(streak.longest_length, streak.current_length)
            streak.last_activity_date = today

        await self.db.commit()
        await self.db.refresh(streak)
        return streak
