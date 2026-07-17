// Evaluates the 12 achievements from the stores for the Achievements screen.

import type { AchievementStats } from '@/data/achievements';
import { evaluateAchievements, quizAchievementStats } from '@/lib/achievements';
import { useDeadlinesStore } from '@/store/use-deadlines-store';
import { useNotesStore } from '@/store/use-notes-store';
import { useQuizStore } from '@/store/use-quiz-store';
import { useUserStore } from '@/store/use-user-store';

export function useAchievements() {
  const notes = useNotesStore((s) => s.notes.length);
  const profile = useUserStore((s) => s.profile);
  const results = useQuizStore((s) => s.results);
  const deadlines = useDeadlinesStore((s) => s.deadlines.length);

  const stats: AchievementStats = {
    notes,
    aiAnswers: profile.aiAnswers,
    streak: profile.streak,
    deadlines,
    ...quizAchievementStats(results),
  };

  const list = evaluateAchievements(stats);
  const unlockedCount = list.filter((a) => a.unlocked).length;
  return { list, unlockedCount, total: list.length };
}
