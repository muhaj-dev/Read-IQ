// Groups saved notes into quizzable subjects; a quiz is built from all of a
// subject's notes, so questions still come only from the student's material.

import type { Note } from '@/types/note';
import type { QuizCount, QuizSource } from '@/types/quiz';

/** Notes without a subject are grouped here. */
const UNFILED_LABEL = 'General';
const UNFILED_ID = 'general';

/** The question-count choices offered before a quiz starts. */
export const QUIZ_COUNT_OPTIONS: readonly QuizCount[] = [10, 20];
/** The count used when none is chosen (the shortest, least-costly quiz). */
export const DEFAULT_QUIZ_COUNT: QuizCount = 10;

/** Coerce a route param back into a valid QuizCount, defaulting safely. */
export function parseQuizCount(raw: string | undefined): QuizCount {
  const n = Number(raw);
  return (QUIZ_COUNT_OPTIONS as readonly number[]).includes(n) ? (n as QuizCount) : DEFAULT_QUIZ_COUNT;
}

/** Stable cache key for a subject label (lowercased; unfiled → 'general'). */
export function sourceIdFor(subject: string | null): string {
  const s = (subject ?? '').trim();
  return s ? s.toLowerCase() : UNFILED_ID;
}

/** Group notes into quizzable subjects, most-notes-first; each group carries its notes. */
export function groupBySubject(notes: Note[]): QuizSource[] {
  const groups = new Map<string, QuizSource>();
  for (const note of notes) {
    const label = note.subject?.trim() || UNFILED_LABEL;
    const id = sourceIdFor(note.subject);
    const existing = groups.get(id);
    if (existing) existing.notes.push(note);
    else groups.set(id, { id, label, notes: [note] });
  }
  return [...groups.values()].sort((a, b) => b.notes.length - a.notes.length);
}

/** Combined note text for a subject quiz (titles as section markers); empty notes skipped. */
export function combineContent(notes: QuizSource['notes']): string {
  return notes
    .filter((n) => n.content.trim().length > 0)
    .map((n) => `# ${n.title}\n${n.content.trim()}`)
    .join('\n\n')
    .trim();
}
