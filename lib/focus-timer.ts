export const MAX_DURATION = 24 * 60 * 60 * 1000;

export type FocusSession = {
  version: 1;
  phase: "running" | "paused" | "ended";
  accumulated: number;
  startedAt: number | null;
  subject: string;
  journal: string;
  date: string;
};

export function elapsedTime(session: FocusSession, now: number) {
  return Math.min(MAX_DURATION, session.accumulated +
    (session.phase === "running" ? Math.max(0, now - session.startedAt!) : 0));
}

export function stopSession(session: FocusSession, now: number, end: boolean): FocusSession {
  const accumulated = elapsedTime(session, now);
  return { ...session, accumulated, startedAt: null,
    phase: end || accumulated >= MAX_DURATION ? "ended" : "paused" };
}

export function restoreSession(raw: string | null, now: number): FocusSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 ||
      !["running", "paused", "ended"].includes(value.phase) ||
      !Number.isFinite(value.accumulated) || value.accumulated < 0 || value.accumulated > MAX_DURATION ||
      (value.phase === "running"
        ? !Number.isFinite(value.startedAt) || value.startedAt < 0 || value.startedAt > now
        : value.startedAt !== null) ||
      typeof value.subject !== "string" || value.subject.length > 80 ||
      typeof value.journal !== "string" || value.journal.length > 10000 ||
      typeof value.date !== "string" || (value.date !== "" && (
        !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
        new Date(`${value.date}T00:00:00.000Z`).toISOString().slice(0, 10) !== value.date))
    ) return null;
    return elapsedTime(value, now) >= MAX_DURATION ? stopSession(value, now, true) : value;
  } catch {
    return null;
  }
}
