import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyHint } from '@/components/home/empty-hint';
import { QuizCountSheet } from '@/components/quiz/quiz-count-sheet';
import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizIntro } from '@/components/quiz/quiz-intro';
import { QuizSourceCard } from '@/components/quiz/quiz-source-card';
import { DEFAULT_QUIZ_COUNT, groupBySubject } from '@/lib/quiz-sources';
import { useTheme } from '@/hooks/use-theme';
import { useNotesStore } from '@/store/use-notes-store';
import type { QuizCount } from '@/types/quiz';

/** QUIZ HOME — pick a subject; quizzes are generated from your notes for it. */
export default function QuizHomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const notes = useNotesStore((s) => s.notes);
  const subjects = groupBySubject(notes);

  // The subject waiting on a question-count choice (null → sheet hidden).
  const [pendingId, setPendingId] = useState<string | null>(null);

  const startWithCount = (count: QuizCount) => {
    const sourceId = pendingId;
    setPendingId(null);
    if (sourceId) {
      router.push({ pathname: '/quiz/active', params: { sourceId, count: String(count) } });
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <QuizHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <QuizIntro
            title="Quiz yourself"
            subtitle="Pick a subject — we’ll build the questions from your notes for it."
          />

          {subjects.length > 0 ? (
            <View className="gap-3">
              {subjects.map((source) => (
                <QuizSourceCard
                  key={source.id}
                  source={source}
                  onPress={() => setPendingId(source.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyHint
              icon="quiz"
              title="No notes to quiz yet"
              subtitle="Add a note first, then we’ll turn your subjects into practice questions."
              cta="Add a note"
              onPress={() => router.push('/add')}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      <QuizCountSheet
        visible={pendingId !== null}
        selected={DEFAULT_QUIZ_COUNT}
        onSelect={startWithCount}
        onCancel={() => setPendingId(null)}
      />
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
    paddingBottom: 32,
    gap: 32,
  },
});
