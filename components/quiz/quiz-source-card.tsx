import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { QuizSource } from '@/types/quiz';

type Props = {
  source: QuizSource;
  onPress: () => void;
};

/** One quizzable subject on the Quiz Home screen — tap to build a quiz. */
export function QuizSourceCard({ source, onPress }: Props) {
  const colors = useTheme();
  const count = source.notes.length;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Quiz yourself on ${source.label}`}
      activeOpacity={0.85}
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-card p-4"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View className="flex-1 flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: colors.menuPurpleWell }}>
          <AppIcon name="school" size={24} color={colors.menuPurple} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>
            {source.label}
          </Text>
          <Text className="mt-1" style={[styles.count, { color: colors.secondary }]}>
            {count} {count === 1 ? 'note' : 'notes'}
          </Text>
        </View>
      </View>
      <AppIcon name="chevron-right" size={24} color={withAlpha(colors.onSurfaceVariant, 0.6)} />
    </TouchableOpacity>
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
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodySemibold,
  },
  count: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
