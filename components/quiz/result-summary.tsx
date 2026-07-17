import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  correct: number;
  total: number;
};

// r=15.9155 in a 36×36 viewBox → circumference ≈ 100, so dash = "percent, 100".
const RING_PATH =
  'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

/** The hero score card: a ring gauge with the percentage + an encouraging line. */
export function ResultSummary({ correct, total }: Props) {
  const colors = useTheme();
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const tint =
    percent >= 80 ? colors.quizCheck : percent >= 50 ? colors.primary : colors.error;
  const message =
    percent >= 80
      ? 'Excellent work!'
      : percent >= 50
        ? 'Good effort — keep going!'
        : 'Keep practising — you’ve got this.';

  return (
    <View
      className="items-center rounded-card p-6"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View className="h-32 w-32 items-center justify-center">
        <Svg width="100%" height="100%" viewBox="0 0 36 36">
          <Path d={RING_PATH} fill="none" stroke={withAlpha(tint, 0.15)} strokeWidth={3} />
          <Path
            d={RING_PATH}
            fill="none"
            stroke={tint}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${percent}, 100`}
          />
        </Svg>
        <Text className="absolute" style={[styles.percent, { color: tint }]}>
          {percent}%
        </Text>
      </View>

      <Text className="mt-4" style={[styles.score, { color: colors.onSurface }]}>
        {correct} of {total} correct
      </Text>
      <Text className="mt-1" style={[styles.message, { color: tint }]}>
        {message}
      </Text>
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
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.headingExtrabold,
  },
  score: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
