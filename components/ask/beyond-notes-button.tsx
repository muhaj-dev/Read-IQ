import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = { onPress: () => void };

/** Quiet opt-in button for a general-knowledge answer from outside the notes. */
export function BeyondNotesButton({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Answer from outside your notes"
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center gap-1.5 self-start py-1">
      <AppIcon name="language" size={15} color={colors.onSurfaceVariant} />
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
        Answer from outside your notes
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyMedium,
    textDecorationLine: 'underline',
  },
});
