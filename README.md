# Pomo

Pomo is a smart Pomodoro productivity web app with a dark-first focus experience. It pairs customizable focus timers with task tracking and turns completed focus sessions into simple, actionable stats.

## Features

### MVP (implemented)
- **Pomodoro timer** with focus / short break / long break phases
- **Timer controls**: start, pause, reset (with auto-advance between phases)
- **Task tracking**: create, edit, and archive tasks
- **Link focus sessions to tasks** via an “active task” selector
- **Productivity stats (local)**: per-task session counts and total focus minutes over the last 7 days

### Planned (next)
- **Mood tracking** (before/after sessions + notes)
- **Daily focus insights** generated from your sessions and mood signals
- **Deeper analytics** (trends, consistency, task throughput over time)
- **Export/import** for portability (JSON)
- **Server-backed persistence** (Prisma + SQLite) to replace localStorage

## Tech stack

- **Frontend**: Next.js (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **State/persistence (MVP)**: browser `localStorage`
- **Planned backend**: Prisma + SQLite + Next.js API routes

## Project layout

- `app/` contains the Next.js app.
- `openspec/` contains the OpenSpec change artifacts for implementing features.

## Local setup

1. Install dependencies:
   ```bash
   cd app
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the app:
   - http://localhost:3000

## How to use (MVP)

1. Add a **task** in the right panel.
2. Set it as the **active task** (the “Active” button next to the task).
3. Start the **timer** (focus phase).
4. When a focus session completes, the session is recorded and linked to the active task.
5. Task stats update automatically (last 7 days).

## Development

- Lint:
  ```bash
  cd app
  npm run lint
  ```
- Production build:
  ```bash
  cd app
  npm run build
  ```

## Privacy

In the MVP, all data is stored locally in your browser (`localStorage`). No authentication or cloud storage is used.

