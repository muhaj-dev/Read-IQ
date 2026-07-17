import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  unlockedCount: number;
  total: number;
  encouragement: string;
  /** Tapping opens the full Achievements list (omit on the list itself). */
  onPress?: () => void;
};

// r ≈ 15.9155 in a 36×36 box → circumference ≈ 100, so dasharray is "percent, 100".
const RING_PATH =
  'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

/** The indigo "Achievements" hero card: a ring showing earned/total badges. */
export function AchievementCard({ unlockedCount, total, encouragement, onPress }: Props) {
  const colors = useTheme();
  const onCard = colors.onPrimary;
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Achievements: ${unlockedCount} of ${total} earned`}
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      disabled={!onPress}
      className="overflow-hidden rounded-card p-6"
      style={[styles.card, { backgroundColor: colors.primaryContainer, shadowColor: colors.shadow }]}>
      <View
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
        style={{ backgroundColor: withAlpha(onCard, 0.05) }}
      />
      <View
        className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full"
        style={{ backgroundColor: withAlpha(onCard, 0.1) }}
      />

      <View className="flex-row items-center gap-4">
        <View className="h-24 w-24 items-center justify-center">
          <Svg width="100%" height="100%" viewBox="0 0 36 36">
            <Path d={RING_PATH} fill="none" stroke={withAlpha(onCard, 0.2)} strokeWidth={3} />
            <Path
              d={RING_PATH}
              fill="none"
              stroke={onCard}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${percent}, 100`}
            />
          </Svg>
          <Text className="absolute" style={[styles.count, { color: onCard }]}>
            {percent}%
          </Text>
        </View>

        <View className="flex-1">
          <Text className="mb-1" style={[styles.title, { color: onCard }]}>
            Achievements
          </Text>
          <View className="flex-row items-center gap-2">
            <AppIcon name="trophy" size={14} color={withAlpha(onCard, 0.7)} />
            <Text style={[styles.meta, { color: withAlpha(onCard, 0.9) }]}>
              {unlockedCount} of {total} earned
            </Text>
          </View>
          <Text className="mt-1" style={[styles.meta, { color: withAlpha(onCard, 0.7) }]}>
            {encouragement}
          </Text>
        </View>

        {onPress ? <AppIcon name="chevron-right" size={22} color={withAlpha(onCard, 0.7)} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  count: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
