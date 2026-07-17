import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { QuizStatus } from '@/store/use-quiz-store';

type Props = {
  status: QuizStatus;
  error: string;
  /** The subject the quiz is being built from — named in the loading copy. */
  sourceLabel: string;
  onRetry: () => void;
  /** Leave the quiz (used by the "empty" state's only way out). */
  onExit: () => void;
};

/** Pre-quiz states: building spinner, thin-subject empty, exhausted, and error. */
export function QuizGate({ status, error, sourceLabel, onRetry, onExit }: Props) {
  const colors = useTheme();

  if (status === 'generating' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View
          className="h-16 w-16 items-center justify-center rounded-pill"
          style={{ backgroundColor: withAlpha(colors.primary, 0.1) }}>
          <ActivityIndicator color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Building your quiz…</Text>
        <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
          Writing questions from your {sourceLabel} notes. Every question comes only from what you
          saved — no outside facts.
        </Text>
      </View>
    );
  }

  if (status === 'empty') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View
          className="h-16 w-16 items-center justify-center rounded-pill"
          style={{ backgroundColor: colors.surfaceContainer }}>
          <AppIcon name="quiz" size={28} color={colors.onSurfaceVariant} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Not enough to quiz yet</Text>
        <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
          Your {sourceLabel} notes are a little too short to build grounded questions from. Add more,
          then come back for a quiz.
        </Text>
        <SecondaryButton label="Back to subjects" onPress={onExit} />
      </View>
    );
  }

  if (status === 'exhausted') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View
          className="h-16 w-16 items-center justify-center rounded-pill"
          style={{ backgroundColor: withAlpha(colors.primary, 0.1) }}>
          <AppIcon name="check-circle" size={28} color={colors.primary} filled />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>You&apos;ve covered it all</Text>
        <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
          No new questions left — you&apos;ve been quizzed on everything in your {sourceLabel} notes.
          Add more notes for fresh questions.
        </Text>
        <SecondaryButton label="Back to subjects" onPress={onExit} />
      </View>
    );
  }

  // error
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View
        className="h-16 w-16 items-center justify-center rounded-pill"
        style={{ backgroundColor: withAlpha(colors.error, 0.12) }}>
        <AppIcon name="warning" size={28} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.onSurface }]}>Couldn&apos;t build the quiz</Text>
      <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>{error}</Text>
      <PrimaryButton label="Try again" onPress={onRetry} />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-card px-6"
      style={{ backgroundColor: colors.primary }}>
      <AppIcon name="auto-awesome" size={18} color={colors.onPrimary} filled />
      <Text style={[styles.button, { color: colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      className="mt-1 h-12 items-center justify-center rounded-card px-6"
      style={{ backgroundColor: colors.surfaceLowest, borderWidth: 1, borderColor: colors.surfaceVariant }}>
      <Text style={[styles.button, { color: colors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: fonts.headingBold,
  },
  blurb: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: fonts.bodyRegular,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
