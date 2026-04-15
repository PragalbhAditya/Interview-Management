# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs custom server with Socket.io)
npm run dev

# Production
npm run start

# Build
npm run build

# Lint
npm run lint
```

The app runs on **port 6969** by default.

> **Important:** Always use `npm run dev` (not `next dev`) — the entry point is `server.js`, not Next.js's built-in dev server. Running `next dev` directly will break Socket.io.

## Architecture Overview

This is a **real-time interview queue management system** built with Next.js + Socket.io + MongoDB (Mongoose).

### Dual-server pattern

`server.js` wraps Next.js inside a plain Node.js HTTP server and attaches a Socket.io instance to it. The `io` instance is stored as `global._socketIO` so that Next.js API routes (which run in the same process) can emit events without needing a separate Socket.io server or HTTP round-trip. Helper functions in `src/lib/socket.js` (`emitQueueUpdated`, `emitPlayBell`) read from this global.

### Data models

- **Room** (`src/models/Room.js`): Represents an interview room. Has a `status` (`ACTIVE`/`PAUSED`), `currentStudents` (array of Student refs being interviewed), and `avgInterviewDuration`.
- **Student** (`src/models/Student.js`): Tracks a student's queue lifecycle. `status` flows: `WAITING` → `INTERVIEWING` → `COMPLETED`. Stores `queuePosition`, `checkInTime`, `interviewStartTime`, `interviewEndTime`, and a `room` ref.

### Pages and their roles

| Route | Purpose |
|---|---|
| `/check-in` | Student self-service check-in form; verifies reg. number against `data/students.xlsx` |
| `/status/[registrationNumber]` | Student's personal queue status view |
| `/dashboard` | Admin view — upload roster, manage all rooms/queues, add/remove students |
| `/interviewer/[roomId]` | Per-room interviewer panel — call next student, end interview, pause/resume |
| `/display/[roomId]` | Public room display board (shown on a TV/monitor in the room) |
| `/display/all` | Multi-room combined display board |

### API routes

- `POST /api/students/check-in` — student self-check-in; reads `data/students.xlsx` to verify identity and auto-assigns to least-loaded active room
- `GET/POST /api/students` — fetch queue (with filters) or manually add a student
- `GET /api/students/[id]` — fetch/update individual student
- `POST /api/interviewer` — actions: `CALL_NEXT`, `END_INTERVIEW`, `TOGGLE_PAUSE`
- `GET /api/rooms` — list all rooms with populated `currentStudents`
- `GET /api/dashboard` — aggregate stats for the admin dashboard
- `POST /api/students/upload` — parse an uploaded `.xlsx` roster and store to `data/students.xlsx`

### Real-time flow

All state changes (check-in, call next, end interview, toggle pause) call `emitQueueUpdated(roomId)` from `src/lib/socket.js`. This emits `queueUpdated` globally and to the specific room channel, plus `dashboardUpdated` to the `dashboard` channel. Client pages use the `useSocket` hook (`src/hooks/useSocket.js`), which maintains a module-level singleton socket and joins the appropriate channel on mount.

### Student roster / Excel

The canonical student list lives at `data/students.xlsx`. The check-in flow reads this file server-side to validate registration numbers and populate name/branch/contact. Upload via the admin dashboard replaces this file.

### Utility scripts

`scripts/` contains one-off Node.js scripts for seeding or resetting database state (e.g., `total_reset.js`, `reset_waiting.js`, `seed_interviewing.js`). Run them directly with `node scripts/<name>.js`.

### Database

MongoDB connection string defaults to a hardcoded remote URI in `src/lib/db.js`. Override with `MONGODB_URI` environment variable (e.g., in `.env.local`).
