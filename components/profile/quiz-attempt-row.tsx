import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/relative-time';
import { withAlpha } from '@/lib/color';
import type { QuizResult } from '@/types/quiz';

type Props = {
  result: QuizResult;
};

/** Score → traffic-light colour: pass green, borderline amber, low red. */
function scoreColor(percent: number, colors: ColorTokens): string {
  if (percent >= 70) return colors.quizCheck;
  if (percent >= 40) return colors.dueSoon;
  return colors.error;
}

/** One finished-quiz row: subject, when it was taken, and a coloured score pill. */
export function QuizAttemptRow({ result }: Props) {
  const colors = useTheme();
  const percent = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const tint = scoreColor(percent, colors);

  return (
    <View
      className="flex-row items-center gap-3 rounded-card p-4"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.menuBlueWell }}>
        <AppIcon name="quiz" size={20} color={colors.menuBlue} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>
          {result.sourceLabel}
        </Text>
        <Text className="mt-0.5" style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {timeAgo(result.createdAt)} · {result.correct}/{result.total} correct
        </Text>
      </View>

      <View
        className="rounded-pill px-3 py-1"
        style={{ backgroundColor: withAlpha(tint, 0.12) }}>
        <Text style={[styles.percent, { color: tint }]}>{percent}%</Text>
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
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  percent: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyBold,
  },
});
