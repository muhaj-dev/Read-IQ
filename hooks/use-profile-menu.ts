// Profile account menu with honest, live subtitles (sessions · avg score · badges).

import { profile, type ProfileMenuItem } from '@/data/profile';
import { useAchievements } from '@/hooks/use-achievements';
import { quizPerformance } from '@/lib/profile-stats';
import { useChatStore } from '@/store/use-chat-store';
import { useQuizStore } from '@/store/use-quiz-store';

export function useProfileMenu(): ProfileMenuItem[] {
  const sessionCount = useChatStore((s) => s.sessions.length);
  const results = useQuizStore((s) => s.results);
  const { unlockedCount, total } = useAchievements();

  const studyCount = sessionCount + results.length;
  const { averagePercent } = quizPerformance(results);

  const subtitles: Record<string, string> = {
    'study-sessions': studyCount > 0 ? `${studyCount} completed` : 'No sessions yet',
    'quiz-performance': averagePercent !== null ? `Average ${averagePercent}%` : 'No quizzes yet',
    achievements: `${unlockedCount} of ${total} unlocked`,
  };

  return profile.menu.map((item) =>
    item.id in subtitles ? { ...item, subtitle: subtitles[item.id] } : item,
  );
}
