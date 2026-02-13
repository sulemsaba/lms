from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.academics import Assessment
from app.models.iam import User
from app.schemas.assessment import AssessmentCreate, AssessmentRead

router = APIRouter()


@router.get("/", response_model=list[AssessmentRead])
async def list_assessments(
    course_id: UUID | None = Query(default=None),
    assessment_status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> list[AssessmentRead]:
    stmt = select(Assessment).where(Assessment.deleted_at.is_(None))
    if course_id:
        stmt = stmt.where(Assessment.course_id == course_id)
    if assessment_status:
        stmt = stmt.where(Assessment.assessment_status == assessment_status)
    stmt = stmt.order_by(Assessment.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> AssessmentRead:
    assessment = Assessment(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        course_id=payload.course_id,
        module_id=payload.module_id,
        title=payload.title,
        assessment_type=payload.assessment_type,
        assessment_status="draft",
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        max_score=payload.max_score,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.get("/{assessment_id}", response_model=AssessmentRead)
async def get_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> AssessmentRead:
    stmt = select(Assessment).where(Assessment.id == assessment_id, Assessment.deleted_at.is_(None))
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("/{assessment_id}/publish", response_model=AssessmentRead)
async def publish_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> AssessmentRead:
    stmt = select(Assessment).where(Assessment.id == assessment_id, Assessment.deleted_at.is_(None))
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    assessment.assessment_status = "published"
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.post("/{assessment_id}/archive", response_model=AssessmentRead)
async def archive_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> AssessmentRead:
    stmt = select(Assessment).where(Assessment.id == assessment_id, Assessment.deleted_at.is_(None))
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    assessment.assessment_status = "archived"
    await db.commit()
    await db.refresh(assessment)
    return assessment
