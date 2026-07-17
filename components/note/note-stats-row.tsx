import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import type { NoteStat } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  stats: NoteStat[];
};

/** The three stat cards on Note Details (AI References · Pages · Added). */
export function NoteStatsRow({ stats }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row gap-3">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="flex-1 items-center justify-center rounded-inner border p-4"
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.outlineVariant,
              shadowColor: colors.shadow,
            },
          ]}>
          {/* Numeric values render display-size; date values ("May 21") stay small, per the mock. */}
          <Text
            style={[
              /^\d+$/.test(stat.value) ? styles.valueBig : styles.valueSmall,
              { color: colors.onSurface },
            ]}>
            {stat.value}
          </Text>
          <Text className="text-center" style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  valueBig: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingSemibold,
  },
  valueSmall: {
    fontSize: 14,
    lineHeight: 32,
    fontFamily: fonts.bodyBold,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
