// Quiz domain model: MCQs generated per subject, grounded in the student's own notes.

import type { Note } from './note';

/** How many questions the student asked for — an explicit choice on Quiz Home. */
export type QuizCount = 10 | 20;

/** A quizzable subject: the student's notes for one course, grouped. */
export type QuizSource = {
  /** Stable key for the subject (the subject name, or 'general' for unfiled). */
  id: string;
  /** The subject/course name shown to the student. */
  label: string;
  /** The notes this quiz draws from. */
  notes: Note[];
};

/** One MCQ answer choice. `key` is the display letter A–D. */
export type QuizOption = {
  key: string;
  text: string;
};

/** A single generated multiple-choice question, grounded in its source note. */
export type QuizQuestion = {
  id: string;
  /** Short concept label from the note (e.g. "Calvin cycle") — feeds weak topics. */
  topic: string;
  prompt: string;
  /** Exactly four options, keyed A–D. */
  options: QuizOption[];
  /** The `key` of the correct option. */
  answerKey: string;
  /** Short "why the answer is right" (from the note); shown on wrong answers. May be ''. */
  explanation: string;
  /** The note this question was written from — the grounding source. */
  sourceNoteId: string;
  sourceNoteTitle: string;
};

/** A question the student got wrong, kept for the result-page review. */
export type MissedQuestion = {
  question: QuizQuestion;
  /** The option key the student picked. */
  selectedKey: string;
};

/** A generated quiz, cached in SQLite by subject id + content hash. */
export type GeneratedQuiz = {
  /** The subject the questions were generated from (QuizSource.id). */
  sourceId: string;
  /** The subject/course name — shown as "From your notes". */
  sourceLabel: string;
  /** Hash of the combined note content the questions were written from — cache key. */
  contentHash: string;
  questions: QuizQuestion[];
  createdAt: string;
  /** How many questions this batch was generated for (in-memory only, not persisted). */
  requestedCount?: number;
};

/** A finished attempt — persisted to `quiz_results`, read back by the Dashboard. */
export type QuizResult = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  total: number;
  correct: number;
  /** Concept topics of the questions the student got wrong. */
  weakTopics: string[];
  createdAt: string;
};
