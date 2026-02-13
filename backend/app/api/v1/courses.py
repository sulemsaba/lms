from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.academics import Course
from app.models.iam import User
from app.schemas.course import CourseCreate, CourseRead

router = APIRouter()


@router.get("/", response_model=list[CourseRead])
async def list_courses(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> list[CourseRead]:
    stmt = select(Course).where(Course.deleted_at.is_(None)).order_by(Course.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> CourseRead:
    stmt = select(Course).where(Course.institution_id == current_user.institution_id, Course.code == payload.code)
    if (await db.execute(stmt)).scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Course code already exists")

    course = Course(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        code=payload.code,
        title=payload.title,
        description=payload.description,
        status="active",
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course
