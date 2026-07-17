// Pure streak helpers — no React, no storage. The user store owns the state;
// these compute the day-streak transitions.

const DAY_MS = 86_400_000;

/** Local calendar day as YYYY-MM-DD (not UTC — a streak is about the student's day). */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days between two YYYY-MM-DD keys (parsed at local midnight). */
export function dayDiff(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`).getTime();
  const to = new Date(`${toKey}T00:00:00`).getTime();
  return Math.round((to - from) / DAY_MS);
}

/** Streak after a day's activity: next day → +1, longer gap or first visit → 1.
 *  Returns null when already counted today (caller skips the write). */
export function nextStreak(
  prev: { streak: number; lastActiveDate: string | null },
  today: string = todayKey(),
): { streak: number; lastActiveDate: string } | null {
  if (prev.lastActiveDate === today) return null;
  if (!prev.lastActiveDate) return { streak: 1, lastActiveDate: today };
  const gap = dayDiff(prev.lastActiveDate, today);
  const streak = gap === 1 ? prev.streak + 1 : 1;
  return { streak, lastActiveDate: today };
}
