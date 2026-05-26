export type PomoPhase = "focus" | "shortBreak" | "longBreak";

export type Task = {
  id: string;
  title: string;
  description: string;
  archived: boolean;
  createdAt: string; // ISO
};

export type FocusSession = {
  id: string;
  taskId: string | null;
  startedAt: string; // ISO
  endedAt: string; // ISO
  actualSeconds: number;
};

export type PomoSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsPerLongBreak: number; // e.g. 4
  autoAdvance: boolean;
};

