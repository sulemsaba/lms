# UDSM Student Hub API Backend

Production-oriented FastAPI backend for the UDSM LMS / Student Hub.

## Features

- Modular monolith architecture with domain-organized modules
- Async SQLAlchemy + PostgreSQL + Alembic
- Redis-backed idempotency and Celery task processing
- JWT auth with device trust workflow
- Offline sync batch processing with conflict recording
- Receipt generation with Merkle-like hash chaining
- Student success services (risk, streaks, badges, skills)
- Notification engine with fallback channels
- Docker Compose stack for local and production-like setups

## Quick Start

1. Create environment file:
   - `cp .env.example .env`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Initialize database:
   - `python scripts/init_db.py`
4. Seed data:
   - `python scripts/seed_data.py`
5. Start API:
   - `uvicorn app.main:app --reload`

## Docker

- Local dev stack:
  - `docker compose up --build`
- Production profile:
  - `docker compose -f docker-compose.prod.yml up --build -d`

## API Docs

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Metrics: `http://localhost:8000/metrics`

## Testing

- `pytest app/tests -q`
