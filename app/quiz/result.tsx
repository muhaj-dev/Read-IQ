import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizIntro } from '@/components/quiz/quiz-intro';
import { ResultActions } from '@/components/quiz/result-actions';
import { ResultReview } from '@/components/quiz/result-review';
import { ResultSummary } from '@/components/quiz/result-summary';
import { ResultTopics } from '@/components/quiz/result-topics';
import { SourceChip } from '@/components/quiz/source-chip';
import { useTheme } from '@/hooks/use-theme';
import { useQuizStore } from '@/store/use-quiz-store';

type Params = {
  correct?: string;
  total?: string;
  sourceId?: string;
  sourceLabel?: string;
  count?: string;
  topics?: string;
};

function parseTopics(raw?: string): string[] {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** QUIZ RESULT — score summary, weak topics, the source note, retry or go home. */
export default function QuizResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const topics = parseTopics(params.topics);
  const review = useQuizStore((s) => s.review);
  // Only show the review when it belongs to the quiz we're showing results for.
  const missed = review && review.sourceLabel === params.sourceLabel ? review.missed : [];

  const home = () => router.navigate('/home');
  // A retry is a fresh attempt: same subject/length, new questions (fresh: '1' regenerates).
  const retry = () => {
    if (params.sourceId) {
      router.replace({
        pathname: '/quiz/active',
        params: { sourceId: params.sourceId, count: params.count ?? '', fresh: '1' },
      });
    } else {
      home();
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <QuizHeader title="Results" onClose={home} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <QuizIntro title="Quiz complete!" subtitle="Here’s how you did on your notes." />
          <ResultSummary correct={correct} total={total} />
          {params.sourceLabel ? <SourceChip label={params.sourceLabel} /> : null}
          <ResultTopics topics={topics} />
          <ResultReview missed={missed} />
        </ScrollView>

        <View className="px-5 pb-2 pt-3">
          <ResultActions onRetry={retry} onHome={home} />
        </View>
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 28,
  },
});
