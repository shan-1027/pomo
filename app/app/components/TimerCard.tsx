"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FocusSession, PomoPhase, PomoSettings } from "@/lib/pomoTypes";
import { formatHhMmSs, safeId } from "@/lib/pomoUtils";

const durationSecForPhase = (phase: PomoPhase, settings: PomoSettings) => {
  if (phase === "focus") return Math.max(60, Math.round(settings.focusMinutes * 60));
  if (phase === "shortBreak")
    return Math.max(30, Math.round(settings.shortBreakMinutes * 60));
  return Math.max(60, Math.round(settings.longBreakMinutes * 60));
};

const phaseLabel: Record<PomoPhase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

export function TimerCard({
  settings,
  activeTaskId,
  activeTaskTitle,
  onSettingsChange,
  onFocusSessionComplete,
}: {
  settings: PomoSettings;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  onSettingsChange: (next: PomoSettings | ((prev: PomoSettings) => PomoSettings)) => void;
  onFocusSessionComplete: (session: FocusSession) => void;
}) {
  const [phase, setPhase] = useState<PomoPhase>("focus");
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() =>
    durationSecForPhase("focus", settings)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [focusInCurrentCycle, setFocusInCurrentCycle] = useState(0);

  // Focus session timing refs (pause-aware).
  const focusStartedAtMsRef = useRef<number | null>(null);
  const focusLastStartMsRef = useRef<number | null>(null);
  const focusAccumulatedMsRef = useRef<number>(0);
  const focusTaskIdRef = useRef<string | null>(null);

  const phaseEndHandledRef = useRef(false);

  const totalSecForPhase = useMemo(
    () => durationSecForPhase(phase, settings),
    [phase, settings]
  );
  const progress = useMemo(() => {
    if (totalSecForPhase <= 0) return 0;
    return Math.min(1, Math.max(0, 1 - timeLeftSec / totalSecForPhase));
  }, [timeLeftSec, totalSecForPhase]);

  const updateSettings = (
    next: PomoSettings | ((prev: PomoSettings) => PomoSettings)
  ) => {
    onSettingsChange((prev) => {
      const computed =
        typeof next === "function" ? (next as (p: PomoSettings) => PomoSettings)(prev) : next;
      if (!isRunning) {
        setTimeLeftSec(durationSecForPhase(phase, computed));
      }
      return computed;
    });
  };

  // When we enter focus, reset pause-aware refs (unless we intentionally carry them).
  useEffect(() => {
    if (phase === "focus") return;
    // Leaving focus to a break: clear focus refs.
    focusStartedAtMsRef.current = null;
    focusLastStartMsRef.current = null;
    focusAccumulatedMsRef.current = 0;
    focusTaskIdRef.current = null;
  }, [phase]);

  // When (re)starting focus, set start timestamps/refs.
  useEffect(() => {
    if (phase !== "focus") return;
    if (!isRunning) return;

    // If this is a fresh focus phase (or resumed focus), ensure refs are set.
    if (focusStartedAtMsRef.current == null) {
      // First start in this focus phase.
      focusStartedAtMsRef.current = Date.now();
      focusAccumulatedMsRef.current = 0;
    }
    if (focusLastStartMsRef.current == null) {
      focusLastStartMsRef.current = Date.now();
      focusTaskIdRef.current = activeTaskId;
    }
  }, [activeTaskId, isRunning, phase]);

  // Countdown loop.
  useEffect(() => {
    if (!isRunning) return;

    const t = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(t);
  }, [isRunning]);

  const start = () => {
    if (isRunning) return;
    if (phase === "focus" && !activeTaskId) {
      // We still allow timer start, but the session will be unlinked.
      // This keeps the UI usable even if user hasn't created tasks yet.
    }
    phaseEndHandledRef.current = false;
    setIsRunning(true);
  };

  const pause = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (phase === "focus" && focusLastStartMsRef.current != null) {
      focusAccumulatedMsRef.current += Date.now() - focusLastStartMsRef.current;
      focusLastStartMsRef.current = null;
    }
  };

  const reset = () => {
    setIsRunning(false);
    setPhase("focus");
    setFocusInCurrentCycle(0);
    setTimeLeftSec(durationSecForPhase("focus", settings));

    focusStartedAtMsRef.current = null;
    focusLastStartMsRef.current = null;
    focusAccumulatedMsRef.current = 0;
    focusTaskIdRef.current = null;
    phaseEndHandledRef.current = false;
  };

  const handlePhaseEnd = useCallback(() => {
    setIsRunning(false);

    if (phase === "focus") {
      // Finalize focus duration (pause-aware).
      if (focusLastStartMsRef.current != null) {
        focusAccumulatedMsRef.current += Date.now() - focusLastStartMsRef.current;
        focusLastStartMsRef.current = null;
      }

      const startedAtMs = focusStartedAtMsRef.current ?? Date.now();
      const actualSeconds = Math.max(1, Math.round(focusAccumulatedMsRef.current / 1000));

      const session: FocusSession = {
        id: safeId(),
        taskId: focusTaskIdRef.current,
        startedAt: new Date(startedAtMs).toISOString(),
        endedAt: new Date().toISOString(),
        actualSeconds,
      };

      onFocusSessionComplete(session);

      // Prepare next phase.
      const nextFocusCount = focusInCurrentCycle + 1;
      const sessionsPerLongBreak = Math.max(2, settings.sessionsPerLongBreak);
      const nextPhase: PomoPhase =
        nextFocusCount % sessionsPerLongBreak === 0 ? "longBreak" : "shortBreak";

      setFocusInCurrentCycle(nextFocusCount);
      setPhase(nextPhase);
      setTimeLeftSec(durationSecForPhase(nextPhase, settings));

      // Clear focus refs for the next focus phase.
      focusStartedAtMsRef.current = null;
      focusAccumulatedMsRef.current = 0;
      focusTaskIdRef.current = null;

      if (settings.autoAdvance) {
        phaseEndHandledRef.current = false;
        setIsRunning(true);
      }
    } else {
      // Break ended -> next focus.
      const nextPhase: PomoPhase = "focus";
      if (phase === "longBreak") setFocusInCurrentCycle(0);

      setPhase(nextPhase);
      setTimeLeftSec(durationSecForPhase(nextPhase, settings));

      // Clear focus refs; they'll be set when focus starts running.
      focusStartedAtMsRef.current = null;
      focusLastStartMsRef.current = null;
      focusAccumulatedMsRef.current = 0;
      focusTaskIdRef.current = null;

      if (settings.autoAdvance) {
        phaseEndHandledRef.current = false;
        setIsRunning(true);
      }
    }
  }, [focusInCurrentCycle, onFocusSessionComplete, phase, settings, setIsRunning]);

  // Fire once per phase completion.
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeftSec !== 0) return;
    if (phaseEndHandledRef.current) return;
    phaseEndHandledRef.current = true;
    handlePhaseEnd();
  }, [handlePhaseEnd, isRunning, timeLeftSec]);

  const sessionsPerLongBreak = Math.max(2, settings.sessionsPerLongBreak);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                Phase
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {phaseLabel[phase]}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                Active task
              </div>
              <div className="mt-1 max-w-[220px] truncate text-sm font-semibold text-zinc-100">
                {activeTaskTitle ?? "None"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-5xl font-bold tracking-tight text-zinc-100">
              {formatHhMmSs(timeLeftSec)}
            </div>
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  {isRunning ? "Running" : "Paused"} •{" "}
                  {phase === "focus"
                    ? `Cycle ${Math.min(focusInCurrentCycle + 1, sessionsPerLongBreak)}/${sessionsPerLongBreak}`
                    : "Break"}
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!isRunning ? (
              <button
                onClick={start}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pause}
                className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
              >
                Pause
              </button>
            )}

            <button
              onClick={reset}
              className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 text-xs text-zinc-400">
            Tip: select an active task to link completed focus sessions to it.
          </div>
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-sm font-semibold text-zinc-100">
              Timer settings
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">Focus (min)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={settings.focusMinutes}
                  disabled={isRunning}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateSettings((prev) => ({
                      ...prev,
                      focusMinutes: Number.isFinite(n) ? n : prev.focusMinutes,
                    }));
                  }}
                  className="w-24 rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600 disabled:opacity-60"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">Short break (min)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={settings.shortBreakMinutes}
                  disabled={isRunning}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateSettings((prev) => ({
                      ...prev,
                      shortBreakMinutes: Number.isFinite(n) ? n : prev.shortBreakMinutes,
                    }));
                  }}
                  className="w-24 rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600 disabled:opacity-60"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">Long break (min)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={settings.longBreakMinutes}
                  disabled={isRunning}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateSettings((prev) => ({
                      ...prev,
                      longBreakMinutes: Number.isFinite(n) ? n : prev.longBreakMinutes,
                    }));
                  }}
                  className="w-24 rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600 disabled:opacity-60"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">Sessions per long break</span>
                <input
                  type="number"
                  min={2}
                  step={1}
                  value={settings.sessionsPerLongBreak}
                  disabled={isRunning}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    updateSettings((prev) => ({
                      ...prev,
                      sessionsPerLongBreak: Number.isFinite(n)
                        ? n
                        : prev.sessionsPerLongBreak,
                    }));
                  }}
                  className="w-24 rounded-lg bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800 outline-none focus:ring-zinc-600 disabled:opacity-60"
                />
              </label>

              <label className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-zinc-400">Auto-advance</span>
                <input
                  type="checkbox"
                  checked={settings.autoAdvance}
                  disabled={isRunning}
                  onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  autoAdvance: e.target.checked,
                }))
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950/40 text-indigo-500 focus:ring-indigo-500"
                />
              </label>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-xs text-zinc-400">
                {activeTaskId ? (
                  <span>
                    Completed focus sessions will be linked to{" "}
                    <span className="font-semibold text-zinc-200">
                      {activeTaskTitle}
                    </span>
                    .
                  </span>
                ) : (
                  <span>
                    Select an active task (right panel) to link sessions.
                    Your focus time will still be tracked in the timer UI.
                  </span>
                )}
              </div>
            </div>
          </div>

          {phase === "focus" ? (
            <div className="mt-3 text-xs text-zinc-500">
              Focus cycle: {focusInCurrentCycle}/{sessionsPerLongBreak - 1} complete
              (long break on the next {sessionsPerLongBreak - (focusInCurrentCycle % sessionsPerLongBreak)} focus).
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

