# UDSM LMS Monorepo

Production implementation workspace for the UDSM LMS (COICT + UDBS + CoHU) pilot.

## Structure

- `backend/`: FastAPI services, domain apps, shared db and models
- `frontend/`: Active Student Hub React + TypeScript app (`src/`)
- `infra/`: Local/staging infrastructure definitions
- `docs/`: Architecture and API documentation

## Local bootstrap

1. Start infrastructure:
   - `docker compose -f infra/docker-compose/docker-compose.yml up -d`
2. Backend:
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -e .[dev]`
   - `uvicorn app.main:app --reload --port 8000`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Notes

- `lms.html` is retained only as a legacy prototype reference.
- New development should target `frontend/src` (run from `frontend/`).
- `frontend/apps/student-hub/` is a legacy prototype and not the active app.
