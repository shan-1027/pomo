# Pomo: Smart Pomodoro Productivity Web App

## What
Pomo is a smart Pomodoro productivity web application that helps you focus with customizable focus timers, task tracking, mood tracking, productivity analytics, and daily focus insights.

Core screens:
- **Dashboard**: current timer, today’s focus summary, and quick prompts.
- **Tasks**: create/manage tasks and optionally assign focus sessions to tasks.
- **Mood**: log mood before/after focus sessions (with notes).
- **Analytics**: trends for focus time, consistency, task throughput, and mood correlations.
- **Daily insights**: a short summary with actionable suggestions based on today’s data.

## Why
Pomodoro apps often stop at timers; Pomo adds structured context (tasks + mood) and turns raw focus history into clear, personalized insights so you can improve how you work—not just how long you work.

## MVP scope
- Single-user (no authentication) with local persistence.
- Customizable timer phases: focus, short break, long break; user-set durations.
- Task tracking: basic CRUD + completion stats tied to focus sessions.
- Mood tracking: before/after mood with a simple scale and optional note.
- Analytics: daily aggregates, streak/consistency indicators, and summary cards.
- Daily insights: computed from focus time, task completion, and mood signals.
- Import/export of data (JSON) for backup.

## Non-goals (for MVP)
- Multi-user accounts + roles/permissions.
- Enterprise-grade admin tooling.
- Offline-first sync across devices.
- Fully automated coaching models requiring external ML services.

## Success metrics
- Users can create tasks and complete at least one focused session end-to-end (timer -> session record -> analytics update).
- Mood logging works reliably without friction.
- Daily insights are understandable and appear within a few seconds of finishing a focus session.

## Assumptions / open questions
- Should Pomo be browser-only single-user for v1, or do you want authentication from day one?
- Preferred tech stack (if you have one) vs defaulting to a modern Next.js + TypeScript setup.

