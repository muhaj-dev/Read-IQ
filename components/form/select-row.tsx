import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onPress: () => void;
  /** Subject rows lead with a small colour dot. */
  dotColor?: string;
};

/** Dropdown-style row: current value + expand chevron, opens an OptionSheet. */
export function SelectRow({ value, onPress, dotColor }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      className="h-12 flex-row items-center justify-between rounded-lg px-4"
      style={[styles.row, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
      <View className="flex-row items-center gap-3">
        {dotColor ? (
          <View className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: dotColor }} />
        ) : null}
        <Text style={[styles.value, { color: colors.onSurface }]}>{value}</Text>
      </View>
      <AppIcon name="expand-more" size={20} color={colors.outline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
});
