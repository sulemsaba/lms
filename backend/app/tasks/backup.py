from datetime import datetime, timezone

from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.backup.backup_database")
def backup_database() -> dict:
    # Replace with pg_dump + object storage upload in production.
    return {"status": "scheduled", "timestamp": datetime.now(timezone.utc).isoformat()}
