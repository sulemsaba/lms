from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.academics import UserSkill
from app.models.iam import User
from app.models.student_success import AcademicStreak, StudentRiskScore, UserBadge

router = APIRouter()


@router.get("/risk")
async def get_risk(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StudentRiskScore)
        .where(StudentRiskScore.user_id == current_user.id)
        .order_by(StudentRiskScore.computed_at.desc())
        .limit(1)
    )
    risk = (await db.execute(stmt)).scalar_one_or_none()
    return risk


@router.get("/streaks")
async def get_streaks(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(AcademicStreak).where(AcademicStreak.user_id == current_user.id)
    return (await db.execute(stmt)).scalars().all()


@router.get("/badges")
async def get_badges(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(UserBadge).where(UserBadge.user_id == current_user.id)
    return (await db.execute(stmt)).scalars().all()


@router.get("/skills")
async def get_skills(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(UserSkill).where(UserSkill.user_id == current_user.id)
    return (await db.execute(stmt)).scalars().all()


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    risk_stmt = (
        select(StudentRiskScore)
        .where(StudentRiskScore.user_id == current_user.id)
        .order_by(StudentRiskScore.computed_at.desc())
        .limit(1)
    )
    risk = (await db.execute(risk_stmt)).scalar_one_or_none()

    streaks_stmt = select(AcademicStreak).where(AcademicStreak.user_id == current_user.id)
    badges_stmt = select(UserBadge).where(UserBadge.user_id == current_user.id)
    skills_stmt = select(UserSkill).where(UserSkill.user_id == current_user.id)

    return {
        "user_id": str(current_user.id),
        "risk": risk,
        "streaks": (await db.execute(streaks_stmt)).scalars().all(),
        "badges": (await db.execute(badges_stmt)).scalars().all(),
        "skills": (await db.execute(skills_stmt)).scalars().all(),
    }
