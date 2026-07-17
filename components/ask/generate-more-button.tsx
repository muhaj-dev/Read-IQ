import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** A continuation is in flight — show a spinner and disable the tap. */
  busy?: boolean;
  onPress: () => void;
};

/** Shown under a length-capped answer to pull in the rest; shows "Generating…" while busy. */
export function GenerateMoreButton({ busy, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Generate more"
      accessibilityState={{ disabled: busy, busy }}
      activeOpacity={0.8}
      disabled={busy}
      onPress={onPress}
      className="flex-row items-center gap-2 self-start rounded-pill border px-3.5 py-2"
      style={{ borderColor: colors.outlineVariant, backgroundColor: colors.surfaceLowest }}>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <AppIcon name="add" size={16} color={colors.primary} />
      )}
      <Text style={[styles.label, { color: colors.primary }]}>
        {busy ? 'Generating…' : 'Generate more'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
});
