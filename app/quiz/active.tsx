import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteMissing } from '@/components/note/note-missing';
import { QuizGate } from '@/components/quiz/quiz-gate';
import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { groupBySubject, parseQuizCount } from '@/lib/quiz-sources';
import { useTheme } from '@/hooks/use-theme';
import { useNotesStore } from '@/store/use-notes-store';
import { type AttemptInput, useQuizStore } from '@/store/use-quiz-store';

/** QUIZ — generates a grounded quiz from the subject's notes, then runs it one question per screen. */
export default function QuizActiveScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { sourceId, count, fresh } = useLocalSearchParams<{
    sourceId?: string;
    count?: string;
    fresh?: string;
  }>();
  const quizCount = parseQuizCount(count);
  const isFresh = fresh === '1';

  const notes = useNotesStore((s) => s.notes);
  const source = useMemo(
    () => groupBySubject(notes).find((s) => s.id === sourceId),
    [notes, sourceId],
  );

  const current = useQuizStore((s) => s.current);
  const status = useQuizStore((s) => s.status);
  const error = useQuizStore((s) => s.error);
  const generate = useQuizStore((s) => s.generate);
  const recordResult = useQuizStore((s) => s.recordResult);

  // Build (or replay the cached) quiz on open; generate() guards against duplicate work.
  useEffect(() => {
    if (source) generate(source, { count: quizCount, fresh: isFresh });
  }, [source, generate, quizCount, isFresh]);

  const exit = () => (router.canGoBack() ? router.back() : router.navigate('/quiz'));

  const onFinish = async (attempt: AttemptInput) => {
    await recordResult(attempt);
    router.replace({
      pathname: '/quiz/result',
      params: {
        sourceId: attempt.sourceId,
        sourceLabel: attempt.sourceLabel,
        count: String(quizCount),
        correct: String(attempt.correct),
        total: String(attempt.total),
        topics: JSON.stringify(attempt.weakTopics),
      },
    });
  };

  if (!source) return <NoteMissing title="Quiz" />;

  const ready = status === 'ready' && !!current && current.questions.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <QuizHeader onClose={exit} />
        {ready ? (
          <QuizRunner key={current.createdAt} quiz={current} onFinish={onFinish} />
        ) : (
          <QuizGate
            status={status}
            error={error}
            sourceLabel={source.label}
            onRetry={() => generate(source, { count: quizCount, fresh: isFresh })}
            onExit={exit}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
