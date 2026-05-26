# Pomo: Implementation Tasks

This checklist breaks work into phases. Each checkbox should be marked `- [x]` when complete.

## Phase 0: Project setup (Foundation)
- [x] Initialize Next.js (App Router) + TypeScript project under `app/`
- [ ] Add formatting/linting setup (ESLint + Prettier) and basic npm scripts
- [ ] Add Tailwind CSS
- [ ] Add environment scaffolding for local development (no secrets in v1)

## Phase 1: Database schema + persistence
- [ ] Add Prisma + SQLite datasource
- [ ] Create Prisma models: `Task`, `MoodEntry`, `FocusSession`
- [ ] Add migrations and verify schema with a local `prisma db push` / migration flow
- [ ] Implement API routes for:
  - [ ] `POST /api/tasks` + `GET /api/tasks` + `PATCH /api/tasks/:id`
  - [ ] `POST /api/moods`
  - [ ] `POST /api/sessions` (focus session create/finalize)

## Phase 2: Timer + focus session recording
- [ ] Implement Timer component with phase state machine (focus/short/long + auto progression)
- [ ] On focus start, persist a draft/future session (or keep id in memory) and record `actualStartAt`
- [ ] On focus end, persist `actualEndAt` and finalize `FocusSession`
- [ ] Add UI to optionally link the active session to a selected `Task`
- [ ] Add UI to capture mood:
  - [ ] quick mood before/after (MVP: prompt before ending focus)
  - [ ] store `moodBeforeId` and `moodAfterId`
- [ ] Ensure timer UI remains responsive (avoid re-rendering every second with heavy computations)

## Phase 3: Task tracking UI
- [ ] Build Tasks page:
  - [ ] create task
  - [ ] edit task title/description
  - [ ] archive task
- [ ] Add “Task focus stats” view (computed from sessions)
- [ ] Wire task selection into the timer start flow

## Phase 4: Mood tracking UI
- [ ] Build Mood page:
  - [ ] list mood entries by date
  - [ ] record mood values + notes
- [ ] Integrate mood prompts after session end (or provide “edit session” if user skipped)

## Phase 5: Analytics + daily insights
- [ ] Implement analytics queries:
  - [ ] today’s total focus minutes + session count
  - [ ] last 7 days trend
  - [ ] task throughput (sessions per task per day/week)
  - [ ] mood delta (after - before) aggregated by day
- [ ] Build Analytics page with charts and summary cards
- [ ] Build Daily Insights section:
  - [ ] derive insight bullets from session completion + mood changes
  - [ ] display insights on dashboard

## Phase 6: Export / import + UX polish
- [ ] Implement export to JSON (tasks, moods, sessions)
- [ ] Implement import from JSON with basic validation
- [ ] Add empty states, error handling, and friendly loading UI
- [ ] Add accessibility basics (keyboard navigation for forms/buttons)

## Phase 7: Tests (targeted)
- [ ] Add unit tests for timer phase transitions and stats aggregation functions
- [ ] Add API route tests for create/update endpoints (happy path + validation)

## Phase 8: “Ready to run”
- [ ] Add README with local setup steps
- [ ] Verify full manual flow:
  - [ ] create a task
  - [ ] run a focus session
  - [ ] log mood
  - [ ] confirm analytics + daily insights update

