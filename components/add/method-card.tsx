import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { AddMethod } from '@/data/add-methods';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  method: AddMethod;
  onPress: () => void;
};

/** One of the four chooser cards: tinted icon circle + title + description. */
export function MethodCard({ method, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={method.title}
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[48%] items-center rounded-card p-6"
      style={[styles.card, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-pill"
        style={{ backgroundColor: colors[method.well] }}>
        <AppIcon name={method.icon} size={32} color={colors[method.tint]} />
      </View>
      <Text className="mb-1" style={[styles.title, { color: colors.onSurface }]}>
        {method.title}
      </Text>
      <Text className="text-center" style={[styles.description, { color: colors.onSurfaceVariant }]}>
        {method.description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
