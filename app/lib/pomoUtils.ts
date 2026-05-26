export function formatHhMmSs(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatMinutes(totalMinutes: number) {
  const m = Math.max(0, totalMinutes);
  if (m < 1) return "< 1 min";
  const whole = Math.floor(m);
  const frac = m - whole;
  return frac >= 0.5 ? `${whole + 1} min` : `${whole} min`;
}

export function cutoffForLastNDays(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function safeId() {
  // Lightweight id for local-only state.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

