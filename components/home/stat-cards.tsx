import { StyleSheet, Text, View } from 'react-native';

import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { DashboardStat, StatTone } from '@/data/dashboard';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  stats: DashboardStat[];
};

function toneColor(tone: StatTone, colors: ColorTokens): string {
  if (tone === 'secondary') return colors.secondary;
  if (tone === 'deep') return colors.primaryDeep;
  return colors.primary;
}

/** The 3-up quick stats row (Notes · AI Answers · Quiz Score). */
export function StatCards({ stats }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row gap-4">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="flex-1 items-center justify-center gap-1 rounded-inner p-4"
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.surfaceLow,
              shadowColor: colors.shadow,
            },
          ]}>
          <Text style={[styles.value, { color: toneColor(stat.tone, colors) }]}>{stat.value}</Text>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{stat.label}</Text>
        </View>
      ))}
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
  value: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
