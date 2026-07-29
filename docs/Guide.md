# Bari's Room - Architecture Guide

## Project Overview

Bari's Room is **not a game**.

It is an **interactive hub website** that looks and feels like a pixel-art game.

Every feature is represented as an object inside the room.

Examples:

- Bulletin Board → Patch Notes
- Desk → World Journal
- Bookshelf → Archive
- CD Player → Music
- Guest Book → Visitor Book
- PC → AI Prompt Site (future)

The room itself is the main hub of the website.

---

# Overall Architecture

```
Browser
    │
    ▼
Next.js
    │
    ├── PixiJS (Bari's Room)
    │
    ├── Admin Pages
    ├── Login
    ├── Settings
    └── Routing
            │
            ▼
        NestJS
            │
            ▼
      PostgreSQL
```

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- PixiJS

### Responsibilities

Next.js

- Application framework
- Routing
- SEO
- Loading
- Authentication
- Admin pages
- API communication

PixiJS

- Entire Bari's Room rendering
- Character movement
- Tilemap
- Furniture
- Interaction
- In-game UI
- Animation
- Lighting
- Season system

**Users should mostly interact with PixiJS.**

Next.js works behind the scenes.

---

## Backend

NestJS

Responsibilities

- REST API
- Authentication
- Admin API
- Patch Notes
- World Journal
- Guest Book
- Music
- Archive
- Database
- File Upload

---

## Database

Preferred

- PostgreSQL

Alternative

- MySQL

---

# Frontend Structure

```
frontend/
│
├── app/
├── components/
├── hooks/
├── services/
├── pixi/
│   ├── core/
│   ├── scenes/
│   ├── characters/
│   ├── objects/
│   ├── ui/
│   ├── systems/
│   ├── assets/
│   └── utils/
│
├── public/
└── package.json
```

---

# Backend Structure

```
backend/
│
├── src/
│   ├── auth/
│   ├── admin/
│   ├── patch-notes/
│   ├── journal/
│   ├── guestbook/
│   ├── music/
│   ├── archive/
│   ├── common/
│   └── config/
│
└── package.json
```

---

# UI Philosophy

The website should feel like a game.

Do NOT build ordinary web modals if the feature belongs inside the room.

Examples:

✔ Patch Notes

Bulletin Board opens
↓

Game-style window animation
↓

Patch Notes UI

---

✔ World Journal

Desk interaction
↓

Book opens

---

✔ Guest Book

Entrance interaction
↓

Notebook UI

---

✔ Music

CD Player interaction
↓

Music Player UI

---

Everything above should be rendered inside PixiJS.

---

# Communication Flow

Example

```
Player clicks Bulletin Board

↓

PixiJS

↓

GET /patch-notes

↓

NestJS

↓

Database

↓

JSON

↓

PixiJS renders Patch Notes UI
```

PixiJS is responsible for rendering.

NestJS is responsible for data.

---

# Development Principles

- Keep frontend and backend completely separated.
- Do not couple PixiJS logic with backend logic.
- Backend should expose REST APIs only.
- PixiJS should never directly access the database.
- Use TypeScript across the entire project.
- Prioritize maintainability over quick implementation.

---

# Goal

Create an interactive pixel-art hub website where the room itself becomes the navigation experience.

The room should feel alive while maintaining a clean separation between:

- Rendering (PixiJS)
- Web Application (Next.js)
- Backend API (NestJS)
- Database (PostgreSQL)