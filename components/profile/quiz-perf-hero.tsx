import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  averagePercent: number;
  bestPercent: number;
  quizzesTaken: number;
  questionsAnswered: number;
  encouragement: string;
};

// r=15.9155 in a 36×36 viewBox → circumference ≈ 100, so dash = "percent, 100".
const RING_PATH =
  'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

/** Score → band tint: strong green, fair indigo, low red. */
function bandTint(percent: number, colors: ColorTokens): string {
  if (percent >= 80) return colors.quizCheck;
  if (percent >= 50) return colors.primary;
  return colors.error;
}

/** Quiz-analytics hero: an average-score ring above a 3-metric stat band. */
export function QuizPerfHero({
  averagePercent,
  bestPercent,
  quizzesTaken,
  questionsAnswered,
  encouragement,
}: Props) {
  const colors = useTheme();
  const tint = bandTint(averagePercent, colors);

  const metrics: { icon: AppIconName; color: string; value: string; label: string }[] = [
    { icon: 'trophy', color: colors.menuOrange, value: `${bestPercent}%`, label: 'Best' },
    { icon: 'quiz', color: colors.menuBlue, value: String(quizzesTaken), label: 'Quizzes' },
    { icon: 'check-circle', color: colors.quizCheck, value: String(questionsAnswered), label: 'Answered' },
  ];

  return (
    <View
      className="rounded-card p-6"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View className="items-center">
        <View className="h-32 w-32 items-center justify-center">
          <Svg width="100%" height="100%" viewBox="0 0 36 36">
            <Path d={RING_PATH} fill="none" stroke={withAlpha(tint, 0.15)} strokeWidth={3} />
            <Path
              d={RING_PATH}
              fill="none"
              stroke={tint}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${averagePercent}, 100`}
            />
          </Svg>
          <Text className="absolute" style={[styles.percent, { color: tint }]}>
            {averagePercent}%
          </Text>
        </View>

        <Text className="mt-4" style={[styles.title, { color: colors.onSurface }]}>
          Average Score
        </Text>
        <Text className="mt-1" style={[styles.encouragement, { color: tint }]}>
          {encouragement}
        </Text>
      </View>

      <View
        className="mt-5 flex-row items-center pt-5"
        style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.outlineVariant, 0.4) }}>
        {metrics.map((m, i) => (
          <View key={m.label} className="flex-1 flex-row items-center justify-center">
            {i > 0 ? (
              <View
                className="self-stretch"
                style={{ width: 1, backgroundColor: withAlpha(colors.outlineVariant, 0.4) }}
              />
            ) : null}
            <View className="flex-1 items-center gap-1">
              <AppIcon name={m.icon} size={18} color={m.color} />
              <Text style={[styles.metricValue, { color: colors.onSurface }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>{m.label}</Text>
            </View>
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
  percent: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.headingExtrabold,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingBold,
  },
  encouragement: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
