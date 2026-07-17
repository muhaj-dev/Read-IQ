import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  chips: string[];
  /** Tapping a chip drops its label into the input as a starting point. */
  onPick: (chip: string) => void;
};

/** Horizontal row of quick-prompt chips (Summarize · Explain · Quiz me · …). */
export function SuggestionChips({ chips, onPick }: Props) {
  const colors = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerStyle={styles.row}>
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip}
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={() => onPick(chip)}
          className="rounded-inner px-4 py-2"
          style={{
            backgroundColor: colors.surfaceLowest,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}>
          <Text style={[styles.label, { color: colors.onSurface }]}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
