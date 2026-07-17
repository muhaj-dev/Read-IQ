import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  label: string;
  /** Enabled only once the current question has been answered. */
  enabled: boolean;
  onPress: () => void;
};

/** Fixed bottom CTA — green "Next Question" (or "Finish") button. */
export function NextButton({ label, enabled, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      activeOpacity={0.9}
      disabled={!enabled}
      onPress={onPress}
      className="w-full items-center justify-center rounded-card py-4"
      style={[
        styles.button,
        {
          backgroundColor: enabled ? colors.quizCorrect : colors.surfaceVariant,
          shadowColor: colors.quizCorrect,
          shadowOpacity: enabled ? 0.35 : 0,
        },
      ]}>
      <Text
        style={[
          styles.label,
          { color: enabled ? colors.onPrimary : withAlpha(colors.onSurfaceVariant, 0.7) },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
  },
});
