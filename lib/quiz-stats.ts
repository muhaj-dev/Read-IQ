// Pure quiz-metric helpers deriving the Dashboard's Quiz Score + Weak Topics.

import type { WeakTopic } from '@/data/dashboard';
import type { QuizResult } from '@/types/quiz';

/** How many weak-topic chips the Dashboard shows at most. */
const WEAK_TOPIC_LIMIT = 6;

/** Latest quiz's score as a whole percentage, or null if none finished. Results are newest-first. */
export function latestScorePercent(results: QuizResult[]): number | null {
  const latest = results[0];
  if (!latest || latest.total <= 0) return null;
  return Math.round((latest.correct / latest.total) * 100);
}

/** Weak Topics: topics missed in the latest quiz are `weak: true`, earlier ones
 *  `weak: false`. De-duplicated, newest-first. Capped at {@link WEAK_TOPIC_LIMIT}
 *  by default; pass `Infinity` for the full list (the "View all" page). */
export function summarizeWeakTopics(
  results: QuizResult[],
  limit: number = WEAK_TOPIC_LIMIT,
): WeakTopic[] {
  if (results.length === 0) return [];

  const latestWeak = new Set(results[0].weakTopics);
  const seen = new Set<string>();
  const topics: WeakTopic[] = [];

  for (const result of results) {
    for (const label of result.weakTopics) {
      if (seen.has(label)) continue;
      seen.add(label);
      topics.push({ label, weak: latestWeak.has(label) });
      if (topics.length >= limit) return topics;
    }
  }
  return topics;
}
