from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class Course(TenantBase):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_course_code_per_inst"),)

    code: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")


class Module(TenantBase):
    __tablename__ = "modules"

    course_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Topic(TenantBase):
    __tablename__ = "topics"

    module_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Assessment(TenantBase):
    __tablename__ = "assessments"

    course_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True)
    module_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(64), nullable=False, default="assignment")
    assessment_status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)


class SkillDefinition(TenantBase):
    __tablename__ = "skill_definitions"
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_skill_code_per_inst"),)

    code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class AssessmentQuestion(TenantBase):
    __tablename__ = "assessment_questions"

    assessment_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    skill_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("skill_definitions.id"), nullable=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(32), nullable=False, default="mcq")
    points: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class AssessmentQuestionOption(TenantBase):
    __tablename__ = "assessment_question_options"

    question_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_questions.id"), nullable=False, index=True)
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(nullable=False, default=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class AssessmentAttempt(TenantBase):
    __tablename__ = "assessment_attempts"

    assessment_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    device_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("devices.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="in_progress")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    server_received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AssessmentResponse(TenantBase):
    __tablename__ = "assessment_responses"

    attempt_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_attempts.id"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_questions.id"), nullable=False, index=True)
    selected_option_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("assessment_question_options.id"), nullable=True
    )
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    points_awarded: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class AssessmentResult(TenantBase):
    __tablename__ = "assessment_results"

    attempt_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_attempts.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    total_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    graded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


class GradingRubric(TenantBase):
    __tablename__ = "grading_rubrics"

    assessment_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_points: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class AssessmentRubricScore(TenantBase):
    __tablename__ = "assessment_rubric_scores"

    result_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_results.id"), nullable=False, index=True)
    rubric_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("grading_rubrics.id"), nullable=False, index=True)
    points: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)


class GradebookEntry(TenantBase):
    __tablename__ = "gradebook_entries"

    course_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    assessment_result_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("assessment_results.id"), nullable=False, index=True
    )
    final_score: Mapped[float] = mapped_column(Float, nullable=False)
    letter_grade: Mapped[str | None] = mapped_column(String(4), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SkillAssessmentLink(TenantBase):
    __tablename__ = "skill_assessment_links"

    skill_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("skill_definitions.id"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assessment_questions.id"), nullable=False, index=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)


class UserSkill(TenantBase):
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("institution_id", "user_id", "skill_id", name="uq_user_skill"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    skill_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("skill_definitions.id"), nullable=False, index=True)
    progress_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    mastery_level: Mapped[str] = mapped_column(String(32), nullable=False, default="beginner")
    updated_from_result_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("assessment_results.id"), nullable=True
    )
