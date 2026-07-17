// The 12 achievements the student can earn, each unlocked from real activity.

import type { AppIconName } from '@/components/ui/app-icon';

/** Live study metrics an achievement is checked against. */
export type AchievementStats = {
  notes: number;
  aiAnswers: number;
  quizzesTaken: number;
  bestScorePercent: number;
  hasPerfectQuiz: boolean;
  streak: number;
  deadlines: number;
};

/** One badge. `isUnlocked` reads the live stats. */
export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: AppIconName;
  isUnlocked: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-note', title: 'First Note', description: 'Save your first note to memory.', icon: 'edit-note', isUnlocked: (s) => s.notes >= 1 },
  { id: 'note-collector', title: 'Note Collector', description: 'Save 5 notes.', icon: 'description', isUnlocked: (s) => s.notes >= 5 },
  { id: 'library-builder', title: 'Library Builder', description: 'Save 20 notes.', icon: 'psychology', isUnlocked: (s) => s.notes >= 20 },
  { id: 'curious-mind', title: 'Curious Mind', description: 'Ask your first question.', icon: 'auto-awesome', isUnlocked: (s) => s.aiAnswers >= 1 },
  { id: 'deep-diver', title: 'Deep Diver', description: 'Ask 10 questions from your notes.', icon: 'analytics', isUnlocked: (s) => s.aiAnswers >= 10 },
  { id: 'quiz-rookie', title: 'Quiz Rookie', description: 'Finish your first quiz.', icon: 'quiz', isUnlocked: (s) => s.quizzesTaken >= 1 },
  { id: 'quiz-regular', title: 'Quiz Regular', description: 'Finish 5 quizzes.', icon: 'school', isUnlocked: (s) => s.quizzesTaken >= 5 },
  { id: 'sharp-mind', title: 'Sharp Mind', description: 'Score 80% or higher on a quiz.', icon: 'star', isUnlocked: (s) => s.bestScorePercent >= 80 },
  { id: 'perfectionist', title: 'Perfectionist', description: 'Ace a quiz with a perfect score.', icon: 'trophy', isUnlocked: (s) => s.hasPerfectQuiz },
  { id: 'on-a-roll', title: 'On a Roll', description: 'Reach a 3-day study streak.', icon: 'flame', isUnlocked: (s) => s.streak >= 3 },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Reach a 7-day study streak.', icon: 'flame', isUnlocked: (s) => s.streak >= 7 },
  { id: 'planner', title: 'Planner', description: 'Add your first deadline.', icon: 'schedule', isUnlocked: (s) => s.deadlines >= 1 },
];
