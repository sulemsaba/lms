from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class TenantBase(Base):
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("institutions.id"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


from app.models.academics import (  # noqa: E402
    Assessment,
    AssessmentAttempt,
    AssessmentQuestion,
    AssessmentQuestionOption,
    AssessmentResponse,
    AssessmentResult,
    AssessmentRubricScore,
    Course,
    GradebookEntry,
    GradingRubric,
    Module,
    SkillAssessmentLink,
    SkillDefinition,
    Topic,
    UserSkill,
)
from app.models.analytics import AnalyticsRollup  # noqa: E402
from app.models.communication import (  # noqa: E402
    Notification,
    NotificationDelivery,
    NotificationPreference,
    NotificationTemplate,
)
from app.models.content import CoursePack, Resource, ResourceBlob, ResourceVersion, UserPin  # noqa: E402
from app.models.helpdesk import EvidenceFile, Ticket, TicketAudit, TicketComment, TicketEvidence  # noqa: E402
from app.models.iam import (  # noqa: E402
    Consent,
    Device,
    DeviceTrustToken,
    ExternalIdentity,
    IdentityDocument,
    IdentityVerification,
    Institution,
    Permission,
    Role,
    RoleBinding,
    RolePermission,
    User,
)
from app.models.offline import OfflineOutbox, SyncConflict  # noqa: E402
from app.models.receipts import Receipt  # noqa: E402
from app.models.student_success import (  # noqa: E402
    AcademicStreak,
    Badge,
    EngagementEvent,
    Intervention,
    Quote,
    StudentRiskScore,
    UserBadge,
    UserQuoteHistory,
)
from app.models.timetable import RouteCache, TimetableEvent, Venue, VenueAlias  # noqa: E402

__all__ = [
    "TenantBase",
    "Institution",
    "User",
    "ExternalIdentity",
    "IdentityVerification",
    "IdentityDocument",
    "Device",
    "DeviceTrustToken",
    "Role",
    "RoleBinding",
    "Permission",
    "RolePermission",
    "Consent",
    "Course",
    "Module",
    "Topic",
    "Assessment",
    "AssessmentQuestion",
    "AssessmentQuestionOption",
    "AssessmentAttempt",
    "AssessmentResponse",
    "AssessmentResult",
    "GradingRubric",
    "AssessmentRubricScore",
    "GradebookEntry",
    "SkillDefinition",
    "SkillAssessmentLink",
    "UserSkill",
    "Resource",
    "ResourceVersion",
    "ResourceBlob",
    "CoursePack",
    "UserPin",
    "TimetableEvent",
    "Venue",
    "VenueAlias",
    "RouteCache",
    "Receipt",
    "OfflineOutbox",
    "SyncConflict",
    "NotificationTemplate",
    "Notification",
    "NotificationDelivery",
    "NotificationPreference",
    "Ticket",
    "TicketComment",
    "TicketEvidence",
    "EvidenceFile",
    "TicketAudit",
    "EngagementEvent",
    "StudentRiskScore",
    "AcademicStreak",
    "Badge",
    "UserBadge",
    "Intervention",
    "Quote",
    "UserQuoteHistory",
    "AnalyticsRollup",
]
