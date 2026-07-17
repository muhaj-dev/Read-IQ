// Shared Deadlines view shapes + the Add-form picker option lists.

import type { SheetOption } from '@/components/form/option-sheet';

export type DeadlineUrgency = 'today' | 'soon' | 'later';

export type UpcomingDeadline = {
  id: string;
  title: string;
  /** "May 20, 2026 • 11:59 PM" */
  when: string;
  /** "Due today" / "1 day left" / "3 days left" */
  status: string;
  urgency: DeadlineUrgency;
  /** Whether the student set a reminder — shows a bell on the card. */
  reminderOn: boolean;
};

export type CalendarCell = {
  day: number;
  /** Adjacent-month days render dimmed (opacity 30% in the mock). */
  inMonth: boolean;
};

/** Full 7-column grid for a month, padded with adjacent-month days. */
export function buildMonthCells(year: number, monthIndex: number): CalendarCell[] {
  const leading = new Date(year, monthIndex, 1).getDay(); // Sunday-first
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrev = new Date(year, monthIndex, 0).getDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;

  return Array.from({ length: total }, (_, i) => {
    if (i < leading) return { day: daysInPrev - leading + 1 + i, inMonth: false };
    if (i < leading + daysInMonth) return { day: i - leading + 1, inMonth: true };
    return { day: i - leading - daysInMonth + 1, inMonth: false };
  });
}

// ── Add Deadline form ──

export type DeadlineDraft = {
  title: string;
  subject: string;
  type: string;
  /** Local "YYYY-MM-DD" (the picker's value). */
  dateValue: string;
  /** 24h "HH:MM" (the picker's value). */
  timeValue: string;
  reminder: string;
  repeat: string;
  notes: string;
  /** Index into DeadlineMarkers (constants/theme.ts). */
  colorIndex: number;
};

/** A blank draft for a new deadline; `dateValue` comes from the caller. */
export function createEmptyDraft(dateValue: string): DeadlineDraft {
  return {
    title: '',
    subject: 'General',
    type: 'Exam',
    dateValue,
    timeValue: '23:59',
    reminder: '1 day before',
    repeat: "Don't repeat",
    notes: '',
    colorIndex: 0,
  };
}

export const pickerOptions: Record<'subject' | 'type' | 'reminder' | 'repeat', SheetOption[]> = {
  subject: [
    { label: 'General' },
    { label: 'Biochemistry' },
    { label: 'Physics' },
    { label: 'Calculus' },
    { label: 'Algorithms' },
    { label: 'Cell Biology' },
  ],
  type: [
    { label: 'Exam' },
    { label: 'Quiz' },
    { label: 'Assignment' },
    { label: 'Lab Report' },
    { label: 'Project' },
  ],
  reminder: [
    { label: 'No reminder' },
    { label: 'At time of event' },
    { label: '5 minutes before' },
    { label: '15 minutes before' },
    { label: '1 hour before' },
    { label: '1 day before' },
    { label: '2 days before' },
    { label: '1 week before' },
    { label: 'Custom', chevron: true },
  ],
  repeat: [
    { label: "Don't repeat" },
    { label: 'Daily' },
    { label: 'Weekly' },
    { label: 'Monthly' },
  ],
};
