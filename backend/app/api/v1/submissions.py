from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.academics import AssessmentAttempt, AssessmentResponse, AssessmentResult
from app.models.iam import User
from app.schemas.submission import (
    AssessmentAttemptCreate,
    AssessmentAttemptRead,
    AssessmentResponseCreate,
    AssessmentResultRead,
    SubmitAttemptRequest,
)
from app.services.grading import GradingService
from app.services.receipt import ReceiptService

router = APIRouter()


@router.post("/attempts", response_model=AssessmentAttemptRead, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    payload: AssessmentAttemptCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> AssessmentAttempt:
    attempt = AssessmentAttempt(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        assessment_id=payload.assessment_id,
        user_id=current_user.id,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


@router.post("/attempts/{attempt_id}/responses", status_code=status.HTTP_201_CREATED)
async def add_response(
    attempt_id: UUID,
    payload: AssessmentResponseCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> dict:
    attempt_stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id, AssessmentAttempt.user_id == current_user.id)
    attempt = (await db.execute(attempt_stmt)).scalar_one_or_none()
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")

    response = AssessmentResponse(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        attempt_id=attempt_id,
        question_id=payload.question_id,
        selected_option_id=payload.selected_option_id,
        answer_text=payload.answer_text,
        points_awarded=0.0,
    )
    db.add(response)
    await db.commit()
    return {"status": "saved"}


@router.post("/attempts/{attempt_id}/submit", response_model=AssessmentResultRead)
async def submit_attempt(
    attempt_id: UUID,
    payload: SubmitAttemptRequest,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> AssessmentResult:
    attempt_stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id, AssessmentAttempt.user_id == current_user.id)
    attempt = (await db.execute(attempt_stmt)).scalar_one_or_none()
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt.status = "submitted"
    attempt.submitted_at = datetime.now(timezone.utc)
    attempt.server_received_at = datetime.now(timezone.utc)

    result = await GradingService(db).grade_attempt(attempt_id)
    await ReceiptService(db).generate_receipt(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        entity_id=attempt_id,
        entity_type="assessment_attempt",
        action="submit",
        payload={"idempotency_key": payload.idempotency_key, "attempt_id": str(attempt_id)},
    )
    await db.commit()
    await db.refresh(result)
    return result


@router.get("/attempts/{attempt_id}", response_model=AssessmentAttemptRead)
async def get_attempt(
    attempt_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> AssessmentAttempt:
    stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id, AssessmentAttempt.user_id == current_user.id)
    attempt = (await db.execute(stmt)).scalar_one_or_none()
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt


@router.post("/results", response_model=AssessmentResultRead, status_code=status.HTTP_201_CREATED)
async def create_result(
    result_in: AssessmentResultRead,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> AssessmentResult:
    result = AssessmentResult(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        attempt_id=result_in.attempt_id,
        user_id=result_in.user_id,
        total_score=result_in.total_score,
        percentage=result_in.percentage,
        version=result_in.version,
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result


@router.put("/results/{result_id}/regrade", response_model=AssessmentResultRead)
async def regrade_result(
    result_id: UUID,
    payload: AssessmentResultRead,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> AssessmentResult:
    stmt = select(AssessmentResult).where(AssessmentResult.id == result_id)
    result = (await db.execute(stmt)).scalar_one_or_none()
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")

    if payload.version != result.version:
        raise HTTPException(status_code=409, detail="Version conflict")

    result.total_score = payload.total_score
    result.percentage = payload.percentage
    result.version += 1
    await db.commit()
    await db.refresh(result)
    return result
