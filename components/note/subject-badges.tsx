import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  subject: string;
  /** Neutral pills after the subject ("PDF", "32 pages"). */
  badges: string[];
};

/** The pill row under the Note Details title (green subject + neutral meta). */
export function SubjectBadges({ subject, badges }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      <View className="rounded-pill px-3 py-1" style={{ backgroundColor: colors.noteGreenWell }}>
        <Text style={[styles.label, { color: colors.noteGreen }]}>{subject}</Text>
      </View>
      {badges.map((badge) => (
        <View
          key={badge}
          className="rounded-pill px-3 py-1"
          style={{ backgroundColor: colors.surfaceContainerHigh }}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{badge}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
