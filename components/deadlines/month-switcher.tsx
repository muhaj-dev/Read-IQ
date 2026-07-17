import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
};

/** "‹ May 2026 ›" month navigation row. Static until deadlines span months. */
export function MonthSwitcher({ label }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row items-center justify-between pt-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        className="h-10 w-10 items-center justify-center">
        <AppIcon name="chevron-left" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Next month"
        className="h-10 w-10 items-center justify-center">
        <AppIcon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
});
