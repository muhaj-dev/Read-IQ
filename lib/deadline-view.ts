// Pure deadline helpers: urgency, countdown, and formatting derived from the due
// date, plus no-dependency date/time choice lists for the Add form's pickers.

import type { AppIconName } from '@/components/ui/app-icon';
import type { DashboardDeadline, DeadlineUrgency } from '@/data/dashboard';
import type { UpcomingDeadline } from '@/data/deadlines';
import { dayDiff, todayKey } from '@/lib/study-stats';
import type { Deadline } from '@/types/deadline';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Whole calendar days from now until the deadline (negative = overdue). */
export function daysUntil(dueIso: string, now: Date = new Date()): number {
  return dayDiff(todayKey(now), todayKey(new Date(dueIso)));
}

/** today = due today or overdue (red) · soon = within 3 days · later = beyond. */
export function urgencyFor(dueIso: string, now: Date = new Date()): DeadlineUrgency {
  const days = daysUntil(dueIso, now);
  if (days <= 0) return 'today';
  if (days <= 3) return 'soon';
  return 'later';
}

/** The list-card countdown, e.g. "Due today" / "1 day left" / "Overdue". */
export function countdownLabel(dueIso: string, now: Date = new Date()): string {
  const days = daysUntil(dueIso, now);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** A compact badge for the dashboard row, e.g. "Today" / "1 day" / "5 days". */
export function badgeLabel(dueIso: string, now: Date = new Date()): string {
  const days = daysUntil(dueIso, now);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 24h "HH:MM" → "11:59 PM". */
export function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}

/** ISO instant → "May 20, 2026 • 11:59 PM" (local). */
export function formatWhen(dueIso: string): string {
  const d = new Date(dueIso);
  if (Number.isNaN(d.getTime())) return '';
  const time = formatTimeLabel(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${time}`;
}

/** Local "YYYY-MM-DD" for a Date (the value the date picker stores). */
export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → "Today" / "Tomorrow" / "Mon, May 20". */
export function formatDateLabel(ymd: string, now: Date = new Date()): string {
  const diff = dayDiff(todayKey(now), ymd);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

/** Combine a "YYYY-MM-DD" date + "HH:MM" time into an ISO instant (local). */
export function combineDue(ymd: string, hhmm: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}

export type Choice = { label: string; value: string };

/** The next `days` calendar days as pickable options (no native picker needed). */
export function dateChoices(now: Date = new Date(), days = 45): Choice[] {
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const value = toDateValue(date);
    return { label: formatDateLabel(value, now), value };
  });
}

/** Common times for the time picker (value is 24h "HH:MM"). */
export const TIME_CHOICES: Choice[] = [
  '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '20:00', '23:59',
].map((value) => ({ label: formatTimeLabel(value), value }));

function iconForType(type: string): AppIconName {
  const t = type.toLowerCase();
  if (t.includes('exam') || t.includes('quiz')) return 'quiz';
  if (t.includes('lab')) return 'description';
  if (t.includes('assign') || t.includes('project')) return 'article';
  return 'schedule';
}

/** Map a stored deadline onto the Deadlines-screen "Upcoming" card shape. */
export function toUpcoming(deadline: Deadline, now: Date = new Date()): UpcomingDeadline {
  return {
    id: deadline.id,
    title: deadline.title,
    when: formatWhen(deadline.dueDate),
    status: countdownLabel(deadline.dueDate, now),
    urgency: urgencyFor(deadline.dueDate, now),
    reminderOn: deadline.reminderOn,
  };
}

/** Map a stored deadline onto the dashboard "Upcoming Deadlines" row shape. */
export function toDashboardDeadline(deadline: Deadline, now: Date = new Date()): DashboardDeadline {
  return {
    id: deadline.id,
    title: deadline.title,
    when: formatWhen(deadline.dueDate),
    badge: badgeLabel(deadline.dueDate, now),
    icon: iconForType(deadline.type),
    urgency: urgencyFor(deadline.dueDate, now),
  };
}

/** Sort soonest-due first — the order both the list and dashboard show. */
export function byDueDate(a: Deadline, b: Deadline): number {
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

/** The current month's view descriptor for the calendar header + grid. */
export function monthView(now: Date = new Date()): {
  label: string;
  year: number;
  monthIndex: number;
  today: number;
} {
  return {
    label: `${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
    today: now.getDate(),
  };
}

/** Day-of-month numbers with a deadline in the given month — the calendar dots. */
export function markedDaysInMonth(deadlines: Deadline[], year: number, monthIndex: number): number[] {
  const days: number[] = [];
  for (const d of deadlines) {
    const due = new Date(d.dueDate);
    if (due.getFullYear() === year && due.getMonth() === monthIndex) days.push(due.getDate());
  }
  return days;
}
