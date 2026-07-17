import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  subjects: string[];
  /** The selected chip — 'All' or one of `subjects`. */
  active: string;
  onSelect: (subject: string) => void;
};

/** Horizontal subject filter pills (All · Biology · Computer Science · …). */
export function SubjectChips({ subjects, active, onSelect }: Props) {
  const colors = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {['All', ...subjects].map((subject) => {
        const selected = subject === active;
        return (
          <TouchableOpacity
            key={subject}
            accessibilityRole="button"
            accessibilityState={selected ? { selected: true } : {}}
            activeOpacity={0.7}
            onPress={() => onSelect(subject)}
            className="rounded-pill px-5 py-2"
            style={{ backgroundColor: selected ? colors.secondary : colors.surfaceVariant }}>
            <Text
              style={[styles.label, { color: selected ? colors.onPrimary : colors.onSurfaceVariant }]}>
              {subject}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    gap: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
