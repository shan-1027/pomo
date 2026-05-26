"use client";

import { useEffect, useMemo } from "react";
import { TaskListPanel } from "./TaskListPanel";
import { TimerCard } from "./TimerCard";
import type { FocusSession, PomoSettings, Task } from "@/lib/pomoTypes";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { cutoffForLastNDays, formatMinutes } from "@/lib/pomoUtils";

const TASKS_KEY = "pomo.tasks.v1";
const SESSIONS_KEY = "pomo.sessions.v1";
const SETTINGS_KEY = "pomo.settings.v1";
const ACTIVE_TASK_KEY = "pomo.activeTaskId.v1";

const defaultSettings: PomoSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsPerLongBreak: 4,
  autoAdvance: true,
};

export function PomoDashboard() {
  const { value: tasks, setValue: setTasks } = useLocalStorageState<Task[]>(
    TASKS_KEY,
    []
  );
  const { value: sessions, setValue: setSessions } =
    useLocalStorageState<FocusSession[]>(SESSIONS_KEY, []);
  const { value: settings, setValue: setSettings } =
    useLocalStorageState<PomoSettings>(SETTINGS_KEY, defaultSettings);
  const { value: activeTaskId, setValue: setActiveTaskId } =
    useLocalStorageState<string | null>(ACTIVE_TASK_KEY, null);

  // If active task gets archived/deleted, clear selection.
  useEffect(() => {
    if (activeTaskId == null) return;
    const stillActive = tasks.some((t) => !t.archived && t.id === activeTaskId);
    if (!stillActive) setActiveTaskId(null);
  }, [activeTaskId, setActiveTaskId, tasks]);

  const nonArchivedTasks = useMemo(() => tasks.filter((t) => !t.archived), [tasks]);
  const activeTask = useMemo(
    () => nonArchivedTasks.find((t) => t.id === activeTaskId) ?? null,
    [activeTaskId, nonArchivedTasks]
  );

  const last7DaysCutoff = useMemo(() => cutoffForLastNDays(7), []);
  const sessionsLast7d = useMemo(
    () => sessions.filter((s) => new Date(s.startedAt).getTime() >= last7DaysCutoff),
    [last7DaysCutoff, sessions]
  );

  const statsByTaskId = useMemo(() => {
    const map = new Map<
      string,
      { sessions: number; focusMinutes: number }
    >();
    for (const s of sessionsLast7d) {
      if (!s.taskId) continue;
      const prev = map.get(s.taskId) ?? { sessions: 0, focusMinutes: 0 };
      map.set(s.taskId, {
        sessions: prev.sessions + 1,
        focusMinutes: prev.focusMinutes + s.actualSeconds / 60,
      });
    }
    return map;
  }, [sessionsLast7d]);

  const totalFocusMinutesThisWeek = useMemo(() => {
    return sessionsLast7d.reduce((acc, s) => acc + s.actualSeconds / 60, 0);
  }, [sessionsLast7d]);

  const handleAddOrUpdateTask = (updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => updater(prev));
  };

  const handleFocusSessionComplete = (session: FocusSession) => {
    setSessions((prev) => [...prev, session].slice(-1000));
  };

  return (
    <div suppressHydrationWarning className="min-h-[calc(100vh-1px)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold tracking-tight text-zinc-50">
            Pomo
          </div>
          <div className="text-sm text-zinc-400">
            Dark-first focus tracking with tasks + Pomodoro sessions.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-right">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Focus this week
          </div>
          <div className="text-lg font-semibold text-zinc-100">
            {formatMinutes(totalFocusMinutesThisWeek)}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TimerCard
              settings={settings}
              activeTaskId={activeTaskId}
              activeTaskTitle={activeTask?.title ?? null}
              onSettingsChange={setSettings}
              onFocusSessionComplete={handleFocusSessionComplete}
            />
          </div>
          <div>
            <TaskListPanel
              tasks={nonArchivedTasks}
              activeTaskId={activeTaskId}
              sessionsByTaskId={statsByTaskId}
              onActiveTaskIdChange={setActiveTaskId}
              onTasksChange={handleAddOrUpdateTask}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

