from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "udsm_lms",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.grading",
        "app.tasks.notifications",
        "app.tasks.analytics",
        "app.tasks.risk",
        "app.tasks.course_pack",
        "app.tasks.backup",
    ],
)

celery_app.conf.beat_schedule = {
    "daily-risk-scoring": {
        "task": "app.tasks.risk.compute_all_risk_scores",
        "schedule": crontab(hour=3, minute=0),
    },
    "hourly-notification-digest": {
        "task": "app.tasks.notifications.process_digest",
        "schedule": crontab(minute=0),
    },
}
celery_app.conf.timezone = "Africa/Dar_es_Salaam"
