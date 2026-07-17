import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  onPress: () => void;
};

/** Edit Note's destructive footer action — a quiet white card with red text. */
export function DeleteNoteButton({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      className="w-full items-center rounded-lg border py-4"
      style={[
        styles.button,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.3),
          shadowColor: colors.shadow,
        },
      ]}>
      <Text style={[styles.label, { color: colors.error }]}>Delete Note</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyBold,
  },
});
