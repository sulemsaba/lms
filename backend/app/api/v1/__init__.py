from fastapi import APIRouter

from app.api.v1 import (
    admin,
    assessments,
    auth,
    content,
    courses,
    helpdesk,
    map,
    notifications,
    public,
    receipts,
    student_success,
    submissions,
    sync,
    timetable,
    users,
    venues,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["timetable"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(map.router, prefix="/map", tags=["map"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(helpdesk.router, prefix="/helpdesk", tags=["helpdesk"])
api_router.include_router(student_success.router, prefix="/student", tags=["student_success"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
