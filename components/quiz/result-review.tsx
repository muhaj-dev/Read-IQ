import { StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/home/section-header';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { MissedQuestion } from '@/types/quiz';

type Props = {
  /** Questions the student got wrong — empty means nothing to review. */
  missed: MissedQuestion[];
};

function optionText(missed: MissedQuestion, key: string): string {
  return missed.question.options.find((o) => o.key === key)?.text ?? '';
}

/** Post-quiz review: correct option + a short grounded "why" for each miss. */
export function ResultReview({ missed }: Props) {
  const colors = useTheme();
  if (missed.length === 0) return null;

  return (
    <View className="gap-3">
      <SectionHeader title="Review your misses" />
      <View className="gap-3">
        {missed.map(({ question, selectedKey }) => (
          <View
            key={question.id}
            className="gap-3 rounded-card p-4"
            style={[
              styles.card,
              { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
            ]}>
            <Text style={[styles.prompt, { color: colors.onSurface }]}>{question.prompt}</Text>

            {/* What the student chose. */}
            <View className="flex-row items-start gap-2">
              <AppIcon name="close" size={18} color={colors.error} />
              <Text className="flex-1" style={[styles.answer, { color: colors.onSurfaceVariant }]}>
                You chose: {optionText({ question, selectedKey }, selectedKey) || '—'}
              </Text>
            </View>

            {/* The correct answer. */}
            <View className="flex-row items-start gap-2">
              <AppIcon name="check-circle" size={18} color={colors.quizCheck} filled />
              <Text className="flex-1" style={[styles.answer, { color: colors.quizCheck }]}>
                {question.answerKey}. {optionText({ question, selectedKey }, question.answerKey)}
              </Text>
            </View>

            {/* Short grounded explanation, if the model gave one. */}
            {question.explanation ? (
              <View
                className="rounded-inner p-3"
                style={{ backgroundColor: withAlpha(colors.secondary, 0.08) }}>
                <Text style={[styles.why, { color: colors.onSurfaceVariant }]}>
                  <Text style={{ color: colors.secondary }}>Why · </Text>
                  {question.explanation}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bodySemibold,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
  why: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodyRegular,
  },
});
