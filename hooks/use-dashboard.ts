// Dashboard view-model — turns the stores into the shapes the home cards render.

import type { AchievementStats } from '@/data/achievements';
import type { DashboardDeadline, DashboardStat, WeakTopic } from '@/data/dashboard';
import {
  encourageAchievements,
  evaluateAchievements,
  quizAchievementStats,
} from '@/lib/achievements';
import { toDashboardDeadline } from '@/lib/deadline-view';
import { latestScorePercent, summarizeWeakTopics } from '@/lib/quiz-stats';
import { useDeadlinesStore } from '@/store/use-deadlines-store';
import { useNotesStore } from '@/store/use-notes-store';
import { useQuizStore } from '@/store/use-quiz-store';
import { useUserStore } from '@/store/use-user-store';

/** How many deadlines the dashboard previews (the rest live on the Deadlines tab). */
const DEADLINE_PREVIEW = 3;

/** Earned-badge summary for the dashboard hero card. */
export type AchievementSummary = { unlockedCount: number; total: number; encouragement: string };

export type DashboardModel = {
  user: { name: string; streakDays: number };
  achievements: AchievementSummary;
  stats: DashboardStat[];
  /** The soonest few deadlines (empty until the student adds one). */
  deadlines: DashboardDeadline[];
  /** All weak topics from recent quizzes (home previews the first few + "View all"). */
  weakTopics: WeakTopic[];
};

export function useDashboard(): DashboardModel {
  const profile = useUserStore((s) => s.profile);
  const noteCount = useNotesStore((s) => s.notes.length);
  const results = useQuizStore((s) => s.results);
  const deadlines = useDeadlinesStore((s) => s.deadlines);

  const score = latestScorePercent(results);
  const stats: DashboardStat[] = [
    { value: String(noteCount), label: 'Notes', tone: 'primary' },
    { value: String(profile.aiAnswers), label: 'AI Answers', tone: 'secondary' },
    // Honest "—" until the student has finished their first quiz.
    { value: score !== null ? `${score}%` : '—', label: 'Quiz Score', tone: 'deep' },
  ];

  const achStats: AchievementStats = {
    notes: noteCount,
    aiAnswers: profile.aiAnswers,
    streak: profile.streak,
    deadlines: deadlines.length,
    ...quizAchievementStats(results),
  };
  const badges = evaluateAchievements(achStats);
  const earned = badges.filter((a) => a.unlocked).length;
  const total = badges.length;

  return {
    user: { name: profile.name.trim() || 'there', streakDays: profile.streak },
    achievements: {
      unlockedCount: earned,
      total,
      encouragement: encourageAchievements(earned, total),
    },
    stats,
    // Store keeps deadlines soonest-due first; preview the nearest few.
    deadlines: deadlines.slice(0, DEADLINE_PREVIEW).map((d) => toDashboardDeadline(d)),
    // Full list — the home card previews the first few and links the rest to /weak-topics.
    weakTopics: summarizeWeakTopics(results, Infinity),
  };
}
