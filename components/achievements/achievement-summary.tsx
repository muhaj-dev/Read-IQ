import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  unlockedCount: number;
  total: number;
  encouragement: string;
};

/** Achievements header: a big trophy with the earned score beside it + a progress bar. */
export function AchievementSummary({ unlockedCount, total, encouragement }: Props) {
  const colors = useTheme();
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <View
      className="rounded-card p-5"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View className="flex-row items-center gap-5">
        <View
          className="items-center justify-center"
          style={[styles.trophyWell, { backgroundColor: colors.menuOrangeWell }]}>
          <AppIcon name="trophy" size={44} color={colors.menuOrange} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-baseline">
            <Text style={[styles.count, { color: colors.menuOrange }]}>{unlockedCount}</Text>
            <Text style={[styles.total, { color: colors.onSurfaceVariant }]}> / {total}</Text>
          </View>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Badges earned</Text>

          <View
            className="mt-3 overflow-hidden rounded-pill"
            style={[styles.track, { backgroundColor: withAlpha(colors.menuOrange, 0.15) }]}>
            <View
              className="h-full rounded-pill"
              style={{ width: `${percent}%`, backgroundColor: colors.menuOrange }}
            />
          </View>
        </View>
      </View>

      <Text className="mt-4" style={[styles.encouragement, { color: colors.onSurface }]}>
        {encouragement}
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
  trophyWell: {
    height: 76,
    width: 76,
    borderRadius: 22,
  },
  count: {
    fontSize: 40,
    lineHeight: 46,
    fontFamily: fonts.headingExtrabold,
  },
  total: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyMedium,
  },
  track: {
    height: 8,
  },
  encouragement: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
