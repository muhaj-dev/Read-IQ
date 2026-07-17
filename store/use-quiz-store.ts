// Quiz store: generates grounded quizzes (cached in SQLite per note+hash), runs attempts, keeps history.

import { create } from 'zustand';

import { BtlError } from '@/lib/btl';
import { getQuiz, insertQuizResult, listQuizResults, saveQuiz } from '@/lib/db';
import { hashContent } from '@/lib/hash';
import { generateQuiz, shuffleQuestionOptions } from '@/lib/quizgen';
import { combineContent, DEFAULT_QUIZ_COUNT } from '@/lib/quiz-sources';
import type { GeneratedQuiz, MissedQuestion, QuizResult, QuizSource } from '@/types/quiz';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Prompts already asked this session, per subject — re-attempts skip these. In-memory only. */
const seenBySource = new Map<string, Set<string>>();

/** Normalise a prompt so trivial wording differences still count as "seen". */
function seenKey(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

function markSeen(sourceId: string, quiz: GeneratedQuiz): void {
  const set = seenBySource.get(sourceId) ?? new Set<string>();
  for (const q of quiz.questions) set.add(seenKey(q.prompt));
  seenBySource.set(sourceId, set);
}

/** Active-screen quiz lifecycle. `empty` = note too thin; `exhausted` = no new questions left. */
export type QuizStatus = 'idle' | 'generating' | 'ready' | 'empty' | 'exhausted' | 'error';

const GENERIC_ERROR = 'Something went wrong building your quiz. Please try again.';

/** What a finished attempt reports back — the store stamps id/createdAt/source. */
export type AttemptInput = {
  sourceId: string;
  sourceLabel: string;
  total: number;
  correct: number;
  weakTopics: string[];
  /** The questions the student got wrong — powers the result-page review. */
  missed: MissedQuestion[];
};

/** The just-finished attempt's misses, held in memory for the result-page review. */
export type QuizReview = {
  sourceLabel: string;
  missed: MissedQuestion[];
};

type QuizState = {
  /** The quiz currently open on the Active screen (or the last one generated). */
  current: GeneratedQuiz | null;
  status: QuizStatus;
  /** Friendly error copy (set only when status is 'error'). */
  error: string;
  /** Recent finished attempts, newest first (from SQLite) — the Dashboard's data. */
  results: QuizResult[];
  /** The last attempt's missed questions, for the result-page review. */
  review: QuizReview | null;
  /** False until the results history has been read from SQLite once. */
  loaded: boolean;
  /** Load the finished-attempt history once on app start. */
  init: () => Promise<void>;
  /** Generate (or replay the cached) quiz for a subject, into `current`. */
  generate: (source: QuizSource, opts?: GenerateOptions) => Promise<void>;
  /** Persist a finished attempt and prepend it to the history. */
  recordResult: (attempt: AttemptInput) => Promise<QuizResult>;
};

/** Controls one `generate` call. */
export type GenerateOptions = {
  /** How many questions to build (10 or 20). Defaults to the shortest. */
  count?: number;
  /** True for a re-attempt — skips every cache and asks for different questions. */
  fresh?: boolean;
};

export const useQuizStore = create<QuizState>((set, get) => ({
  current: null,
  status: 'idle',
  error: '',
  results: [],
  review: null,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const results = await listQuizResults();
      set({ results, loaded: true });
    } catch (err) {
      // Never block the app over storage — start with an empty history.
      console.warn('[quiz] failed to load results', err);
      set({ loaded: true });
    }
  },

  generate: async (source, opts = {}) => {
    if (get().status === 'generating') return;
    const count = opts.count ?? DEFAULT_QUIZ_COUNT;
    const fresh = opts.fresh ?? false;
    const content = combineContent(source.notes);
    const hash = hashContent(content);

    // Not a re-attempt: replay the open quiz when subject, notes, and length match — no model call.
    if (!fresh) {
      const cur = get().current;
      if (
        cur &&
        cur.sourceId === source.id &&
        cur.contentHash === hash &&
        cur.requestedCount === count
      ) {
        set({ status: cur.questions.length > 0 ? 'ready' : 'empty' });
        return;
      }
    }

    set({ status: 'generating', error: '', current: null });
    try {
      // First attempt only: reuse the SQLite cache when it holds enough questions.
      if (!fresh) {
        let stored: GeneratedQuiz | null = null;
        try {
          stored = await getQuiz(source.id);
        } catch (err) {
          console.warn('[quiz] failed to read cached quiz', err);
        }
        if (stored && stored.contentHash === hash && stored.questions.length >= count) {
          const quiz: GeneratedQuiz = {
            ...stored,
            // Re-letter answers on read — quizzes cached before the de-bias fix
            // still cluster the correct answer under B, and regenerating costs credits.
            questions: stored.questions.slice(0, count).map(shuffleQuestionOptions),
            requestedCount: count,
          };
          markSeen(source.id, quiz);
          set({ current: quiz, status: 'ready' });
          return;
        }
      }

      // A re-attempt tells the generator which questions to steer away from.
      const avoid = fresh ? [...(seenBySource.get(source.id) ?? [])] : [];
      const questions = await generateQuiz(
        { id: source.id, title: source.label, subject: source.label, content },
        { count, avoid },
      );
      if (questions.length === 0) {
        // Nothing new on a re-attempt ⇒ the note's questions are used up, not thin.
        set({ status: fresh ? 'exhausted' : 'empty' });
        return;
      }

      const quiz: GeneratedQuiz = {
        sourceId: source.id,
        sourceLabel: source.label,
        contentHash: hash,
        questions,
        createdAt: new Date().toISOString(),
        requestedCount: count,
      };
      markSeen(source.id, quiz);
      // Best-effort cache — a failed write just means we regenerate next time.
      try {
        await saveQuiz(quiz);
      } catch (err) {
        console.warn('[quiz] failed to cache quiz', err);
      }
      set({ current: quiz, status: 'ready' });
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      set({ status: 'error', error: friendly });
    }
  },

  recordResult: async (attempt) => {
    const result: QuizResult = {
      id: createId(),
      sourceId: attempt.sourceId,
      sourceLabel: attempt.sourceLabel,
      total: attempt.total,
      correct: attempt.correct,
      weakTopics: attempt.weakTopics,
      createdAt: new Date().toISOString(),
    };
    try {
      await insertQuizResult(result);
    } catch (err) {
      console.warn('[quiz] failed to persist result', err);
    }
    set((s) => ({
      results: [result, ...s.results],
      review: { sourceLabel: attempt.sourceLabel, missed: attempt.missed },
    }));
    return result;
  },
}));
