// Pure achievement logic — evaluate the badges and summarise progress.

import { ACHIEVEMENTS, type Achievement, type AchievementStats } from '@/data/achievements';
import type { QuizResult } from '@/types/quiz';

export type EvaluatedAchievement = Achievement & { unlocked: boolean };

/** Best-score / perfect-quiz stats derived from the raw attempt history. */
export function quizAchievementStats(results: QuizResult[]) {
  let bestScorePercent = 0;
  let hasPerfectQuiz = false;
  for (const r of results) {
    if (r.total <= 0) continue;
    const pct = Math.round((r.correct / r.total) * 100);
    if (pct > bestScorePercent) bestScorePercent = pct;
    if (r.correct === r.total) hasPerfectQuiz = true;
  }
  return { quizzesTaken: results.length, bestScorePercent, hasPerfectQuiz };
}

/** Tag every badge with whether it's earned yet. */
export function evaluateAchievements(stats: AchievementStats): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.isUnlocked(stats) }));
}

/** A short line keyed to how many badges are earned. */
export function encourageAchievements(unlocked: number, total: number): string {
  if (unlocked <= 0) return 'Earn your first badge!';
  if (unlocked >= total) return 'All badges earned! 🎉';
  if (unlocked >= total * 0.66) return 'So close — keep going!';
  if (unlocked >= total * 0.33) return 'Great progress!';
  return 'Nice start — keep it up!';
}
