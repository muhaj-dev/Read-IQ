// Deadline domain model — stored in SQLite; urgency + countdown derived from dueDate at read time.

export type Deadline = {
  id: string;
  title: string;
  subject: string | null;
  /** Exam / Quiz / Assignment / Lab Report / Project. */
  type: string;
  /** ISO timestamp of when it's due. */
  dueDate: string;
  /** Whether the student asked for a reminder (drives the future notification). */
  reminderOn: boolean;
  /** Human label of the reminder lead time, e.g. "1 day before". */
  reminderLabel: string;
  /** "Don't repeat" / Daily / Weekly / Monthly. */
  repeat: string;
  notes: string;
  /** Index into DeadlineMarkers (constants/theme.ts) — the card's colour dot. */
  colorIndex: number;
  createdAt: string;
};

/** What the Add Deadline form passes to the store — id/createdAt are filled in. */
export type DeadlineInput = {
  title: string;
  subject: string | null;
  type: string;
  dueDate: string;
  reminderOn: boolean;
  reminderLabel: string;
  repeat: string;
  notes: string;
  colorIndex: number;
};
