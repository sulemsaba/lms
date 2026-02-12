from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_success import Badge, UserBadge


class BadgeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def award_badge(self, user_id, institution_id, badge_code: str, evidence: dict):
        badge_stmt = select(Badge).where(Badge.code == badge_code, Badge.institution_id == institution_id)
        badge = (await self.db.execute(badge_stmt)).scalar_one_or_none()
        if badge is None:
            return None

        existing_stmt = select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id,
            UserBadge.institution_id == institution_id,
        )
        existing = (await self.db.execute(existing_stmt)).scalar_one_or_none()
        if existing:
            return existing

        user_badge = UserBadge(
            institution_id=institution_id,
            created_by=user_id,
            user_id=user_id,
            badge_id=badge.id,
            evidence_json=evidence,
        )
        self.db.add(user_badge)
        await self.db.commit()
        await self.db.refresh(user_badge)
        return user_badge
