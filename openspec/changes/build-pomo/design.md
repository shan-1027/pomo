# Pomo: Design

## Overview
Pomo is a web app with:
- A timer UI that captures focus sessions (with planned and actual timestamps).
- Task tracking that can optionally link sessions to tasks.
- Mood tracking before/after focus sessions.
- Analytics derived from recorded sessions (and mood signals).
- Daily insights computed from today’s aggregates.

## Proposed tech stack
- Frontend: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS
- Backend: Next.js Route Handlers (`/app/api/*`)
- Database: SQLite (local) with Prisma ORM
- Charts: Chart.js or Recharts
- Data export/import: JSON file download/upload

## High-level architecture
1. **UI layer** (React components)
   - Timer component manages phase transitions and emits “focus session started/ended” events.
   - Forms: tasks CRUD, mood logging, and session-level notes.
2. **API layer**
   - Validates payloads and persists `tasks`, `moods`, and `focus_sessions`.
   - Provides summary endpoints for analytics and daily insights.
3. **Persistence layer**
   - Prisma models for normalized, query-friendly data.

## Data model (minimal v1)
Entities:
- `Task`
  - `id` (uuid)
  - `title` (string)
  - `description` (string, optional)
  - `status` (`active` | `archived`)
  - `createdAt`, `updatedAt`
- `MoodEntry`
  - `id` (uuid)
  - `value` (int, e.g. 1-5)
  - `label` (string, e.g. "low/ok/good", optional)
  - `notes` (string, optional)
  - `createdAt`
- `FocusSession`
  - `id` (uuid)
  - `taskId` (uuid, nullable)  // optional linkage
  - `phasePlan` (json: planned durations per phase) (optional but useful)
  - `plannedDurationSec` (int)
  - `actualStartAt` (datetime)
  - `actualEndAt` (datetime)
  - `notes` (string, optional)
  - `moodBeforeId` (uuid, nullable)
  - `moodAfterId` (uuid, nullable)
  - `createdAt`
- `TaskSessionStats` (computed, not stored)
  - Derived from `FocusSession` rows in date ranges.

Analytics are computed on demand (or cached later):
- Daily totals (focus seconds, session count)
- Task throughput (sessions per task per day/week)
- Consistency indicators (e.g., days with >= X minutes)
- Mood deltas (after - before) and correlation with focus outcomes.

## Timer logic details
Timer is modeled as a **phase state machine**:
1. `idle`
2. `runningFocus`
3. `runningShortBreak` / `runningLongBreak`
4. `completedFocusCycle`

Implementation choices:
- Store `actualStartAt` and `actualEndAt` as the source of truth.
- Use the UI clock for display, but persist timestamps when starting/ending phases to reduce drift.
- Allow user configuration:
  - focus duration (sec/min)
  - short break duration
  - long break duration
  - sessions per long break (classic Pomodoro: 4)

Capture flow (MVP):
- When focus phase starts: create a “draft session” record (or keep in memory and finalize at end).
- When focus phase ends:
  - finalize `FocusSession`
  - optionally prompt for mood before/after (or quick mood entry before ending)
  - show a “session saved” confirmation and update daily insights.

## API surface (draft)
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/tasks?status=active`
- `POST /api/moods`
- `POST /api/sessions` (or separate start/end endpoints)
- `GET /api/insights/today`
- `GET /api/analytics?range=7d|30d`

## UI / UX flows (brief)
- Dashboard
  - show active timer
  - show “Today: X focus minutes, Y sessions, mood trend”
  - quick action: “Log mood for last session” if not completed
- Tasks
  - add/edit/archive
  - show “focus minutes this week” for each task
  - optionally select a “focus task” before starting the timer
- Mood
  - prompt: mood before focus (optional)
  - prompt: mood after focus (recommended after session ends)
  - store notes
- Analytics + daily insights
  - charts and summary cards
  - actionable suggestions (e.g., “Your mood improved after sessions; consider pairing tasks with longer focus blocks.”)

## Privacy & security (pragmatic MVP)
- Single-user local persistence.
- No cloud sync required in v1.
- Export/import provides user-controlled data portability.

