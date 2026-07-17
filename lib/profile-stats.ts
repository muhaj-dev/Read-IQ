// Pure profile-analytics helpers — quiz-performance metrics + a study-activity timeline.

import type { ChatSession } from '@/types/chat';
import type { QuizResult } from '@/types/quiz';

/** Aggregated quiz metrics for the Quiz Performance page. */
export type QuizPerformance = {
  /** Mean of each attempt's score %, or null before the first quiz. */
  averagePercent: number | null;
  bestPercent: number;
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  encouragement: string;
};

function encourageScore(average: number | null): string {
  if (average === null) return 'Take a quiz to see your performance.';
  if (average >= 90) return 'Outstanding mastery! 🎉';
  if (average >= 75) return 'Strong work — keep it up!';
  if (average >= 50) return 'Solid progress — keep practicing.';
  return 'Keep going — review your weak topics.';
}

/** Summarise the attempt history (newest-first) into the Quiz Performance view. */
export function quizPerformance(results: QuizResult[]): QuizPerformance {
  let bestPercent = 0;
  let questionsAnswered = 0;
  let correctAnswers = 0;
  let percentSum = 0;
  let scored = 0;

  for (const r of results) {
    if (r.total <= 0) continue;
    const pct = Math.round((r.correct / r.total) * 100);
    if (pct > bestPercent) bestPercent = pct;
    questionsAnswered += r.total;
    correctAnswers += r.correct;
    percentSum += pct;
    scored += 1;
  }

  const averagePercent = scored > 0 ? Math.round(percentSum / scored) : null;
  return {
    averagePercent,
    bestPercent,
    quizzesTaken: results.length,
    questionsAnswered,
    correctAnswers,
    encouragement: encourageScore(averagePercent),
  };
}

/** One entry in the study-activity timeline — an Ask chat or a finished quiz. */
export type StudyKind = 'ask' | 'quiz';

export type StudyActivity = {
  id: string;
  kind: StudyKind;
  title: string;
  subtitle: string;
  /** ISO timestamp the activity last happened — the sort + "time ago" key. */
  at: string;
};

/** Merge Ask sessions + quiz attempts into one newest-first study timeline. */
export function buildStudyActivity(
  sessions: ChatSession[],
  results: QuizResult[],
): StudyActivity[] {
  const asks: StudyActivity[] = sessions.map((s) => {
    const turns = Math.floor(s.messageCount / 2) || 1;
    return {
      id: `ask-${s.id}`,
      kind: 'ask',
      title: s.title || 'Ask session',
      subtitle: `${turns} ${turns === 1 ? 'question' : 'questions'} asked`,
      at: s.updatedAt,
    };
  });

  const quizzes: StudyActivity[] = results.map((r) => ({
    id: `quiz-${r.id}`,
    kind: 'quiz',
    title: `${r.sourceLabel} quiz`,
    subtitle: `Scored ${r.correct}/${r.total}`,
    at: r.createdAt,
  }));

  return [...asks, ...quizzes].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}
