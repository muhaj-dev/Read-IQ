import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyHint } from '@/components/home/empty-hint';
import { WeakTopicChips } from '@/components/home/weak-topic-chips';
import { SettingsHeader } from '@/components/settings/settings-header';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { summarizeWeakTopics } from '@/lib/quiz-stats';
import { useQuizStore } from '@/store/use-quiz-store';

/** All weak topics from recent quizzes — the "View all" target from the dashboard. */
export default function WeakTopicsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const results = useQuizStore((s) => s.results);
  const topics = summarizeWeakTopics(results, Infinity);
  const failing = topics.filter((t) => t.weak).length;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Weak Topics" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {topics.length > 0 ? (
            <View className="gap-4">
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {failing > 0
                  ? `${failing} ${failing === 1 ? 'topic' : 'topics'} to review from your latest quiz, plus earlier ones worth another look.`
                  : 'Topics from your recent quizzes worth another look.'}
              </Text>
              <WeakTopicChips topics={topics} />
            </View>
          ) : (
            <EmptyHint
              icon="quiz"
              title="No weak topics yet"
              subtitle="Take a quiz and we'll surface the topics worth reviewing here."
              cta="Start a quiz"
              onPress={() => router.push('/quiz')}
            />
          )}
        </ScrollView>
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
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
  },
});
