# UDSM Student Hub - Frontend

Production-ready React + TypeScript PWA scaffold for the UDSM LMS Student Hub.

## Source Of Truth

- Main source code: `./src/`
- Main routes: `/courses`, `/assessments`, `/map`, `/profile`, `/timetable`, `/helpdesk`
- Development server: `npm run dev`

Ignore `frontend/apps/student-hub/` for daily development. That folder is an old prototype.

## Run

1. `npm install`
2. `npm run dev`
3. Open `http://127.0.0.1:5174/`

## Build

- `npm run build`
- `npm run preview`

## Included foundations

- Offline-first data layer with Dexie (`src/services/db`)
- Background sync runner (`src/services/sync`)
- Zustand stores for auth, sync, queue, and venues (`src/stores`)
- Design tokens and global styles (`src/styles`)
- Component system with CSS Modules (`src/components`)
