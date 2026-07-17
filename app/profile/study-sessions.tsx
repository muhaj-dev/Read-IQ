import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyHint } from '@/components/home/empty-hint';
import { StatCards } from '@/components/home/stat-cards';
import { SessionActivityRow } from '@/components/profile/session-activity-row';
import { SettingsHeader } from '@/components/settings/settings-header';
import type { DashboardStat } from '@/data/dashboard';
import { useTheme } from '@/hooks/use-theme';
import { buildStudyActivity } from '@/lib/profile-stats';
import { useChatStore } from '@/store/use-chat-store';
import { useQuizStore } from '@/store/use-quiz-store';

/** STUDY SESSIONS — a newest-first timeline of Ask chats + finished quizzes. */
export default function StudySessionsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const sessions = useChatStore((s) => s.sessions);
  const initChat = useChatStore((s) => s.init);
  const results = useQuizStore((s) => s.results);
  const initQuiz = useQuizStore((s) => s.init);

  // Both inits are idempotent — safe if the app already loaded them on start.
  useEffect(() => {
    initChat();
    initQuiz();
  }, [initChat, initQuiz]);

  const activity = buildStudyActivity(sessions, results);
  const stats: DashboardStat[] = [
    { value: String(activity.length), label: 'Sessions', tone: 'primary' },
    { value: String(sessions.length), label: 'Ask Chats', tone: 'secondary' },
    { value: String(results.length), label: 'Quizzes', tone: 'deep' },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Study Sessions" />

        <FlatList
          data={activity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            activity.length > 0 ? (
              <View className="mb-4">
                <StatCards stats={stats} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <SessionActivityRow activity={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <EmptyHint
              icon="history-edu"
              title="No study sessions yet"
              subtitle="Ask a question or take a quiz and your study activity will show up here."
              cta="Ask a question"
              onPress={() => router.push('/ask')}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
