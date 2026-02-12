from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import AssessmentQuestion, AssessmentResponse, SkillAssessmentLink, UserSkill


class SkillService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def recalculate_user_skills(self, user_id, institution_id):
        link_stmt = select(SkillAssessmentLink.skill_id).where(SkillAssessmentLink.institution_id == institution_id).distinct()
        skill_ids = [row[0] for row in (await self.db.execute(link_stmt)).all()]
        updated = []

        for skill_id in skill_ids:
            total_stmt = (
                select(func.sum(AssessmentQuestion.points))
                .join(SkillAssessmentLink, SkillAssessmentLink.question_id == AssessmentQuestion.id)
                .where(SkillAssessmentLink.skill_id == skill_id, AssessmentQuestion.institution_id == institution_id)
            )
            total = float((await self.db.execute(total_stmt)).scalar_one() or 0)

            earned_stmt = (
                select(func.sum(AssessmentResponse.points_awarded))
                .join(AssessmentQuestion, AssessmentQuestion.id == AssessmentResponse.question_id)
                .join(SkillAssessmentLink, SkillAssessmentLink.question_id == AssessmentQuestion.id)
                .where(
                    SkillAssessmentLink.skill_id == skill_id,
                    AssessmentResponse.institution_id == institution_id,
                    AssessmentResponse.created_by == user_id,
                )
            )
            earned = float((await self.db.execute(earned_stmt)).scalar_one() or 0)

            progress = (earned / total * 100) if total > 0 else 0
            if progress >= 100:
                mastery = "master"
            elif progress >= 90:
                mastery = "proficient"
            elif progress >= 80:
                mastery = "novice"
            else:
                mastery = "beginner"

            stmt = select(UserSkill).where(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == skill_id,
                UserSkill.institution_id == institution_id,
            )
            user_skill = (await self.db.execute(stmt)).scalar_one_or_none()
            if user_skill is None:
                user_skill = UserSkill(
                    institution_id=institution_id,
                    created_by=user_id,
                    user_id=user_id,
                    skill_id=skill_id,
                    progress_pct=progress,
                    mastery_level=mastery,
                )
                self.db.add(user_skill)
            else:
                user_skill.progress_pct = progress
                user_skill.mastery_level = mastery

            updated.append(user_skill)

        await self.db.commit()
        return updated
