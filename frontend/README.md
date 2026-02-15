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

## Role-aware login

- The app now routes by RBAC role after sign-in (student, teaching, admin, guest).
- Provide institution UUID in login or set `VITE_INSTITUTION_ID` in your frontend environment.
- If backend auth is unavailable, use "Continue In Demo Mode" to preview role-specific UI.
- Super-admins can use Profile -> Role Switcher to impersonate another role without logging out.

## Build

- `npm run build`
- `npm run preview`

## Included foundations

- Offline-first data layer with Dexie (`src/services/db`)
- Background sync runner (`src/services/sync`)
- Zustand stores for auth, sync, queue, and venues (`src/stores`)
- Design tokens and global styles (`src/styles`)
- Component system with CSS Modules (`src/components`)

## New useful modules

- Side navigation rail replacing bottom tabs for faster multi-module access
- Theme toggle (light/dark) persisted in browser storage
- Tasks board (`/tasks`) for personal planning with local persistence
- Study notes (`/notes`) for offline note-taking with pin/search support
- Notifications center (`/notifications`) with read/unread control
- Queue manager (`/queue-manager`) for manual sync, retry, and failed-item cleanup
- Global search (`/search`) across modules, courses, timetable, tasks, notes, notifications, and venues
- Activity snapshot on Home (open tasks, unread alerts, note count)
