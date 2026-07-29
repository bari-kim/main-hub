# Bari's Room

This repository is split into two independent applications:

- `frontend/`: React game client, UI, API calls, and static asset handling
- `backend/`: Spring Boot REST API, admin tools, content services, and persistence

## Current layout

```text
project-root/
戍式式 frontend/
戍式式 backend/
戍式式 docs/
戌式式 README.md
```

## Frontend

Run from `frontend/`:

```bash
npm install
npm run dev
```

## Backend

The backend is scaffolded as an independent Spring Boot project under `backend/`.
It currently contains only the application skeleton so the frontend structure can be separated first without changing game behavior.
