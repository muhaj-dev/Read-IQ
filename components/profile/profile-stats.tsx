import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/profile/glass-card';
import { fonts } from '@/constants/typography';
import type { ProfileStat } from '@/data/profile';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  stats: ProfileStat[];
};

/** The 3-up glass stats row (Notes · AI Answers · Day Streak). */
export function ProfileStats({ stats }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row gap-3">
      {stats.map((stat) => (
        <GlassCard
          key={stat.label}
          className="flex-1 items-center justify-center gap-1 rounded-card p-4">
          <Text style={[styles.value, { color: colors.onPrimary }]}>{stat.value}</Text>
          <Text style={[styles.label, { color: colors.onPrimarySoft }]}>{stat.label}</Text>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  value: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingSemibold,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
  },
});
