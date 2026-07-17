import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  current: number;
  total: number;
};

/** "Question N of M" label above a thin fill bar that tracks progress. */
export function QuizProgress({ current, total }: Props) {
  const colors = useTheme();
  const percent = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <View className="gap-2">
      <Text className="text-center" style={[styles.label, { color: colors.onSurfaceVariant }]}>
        Question {current} of {total}
      </Text>
      <View
        className="h-1.5 w-full overflow-hidden rounded-pill"
        style={{ backgroundColor: colors.surfaceVariant }}>
        <View
          className="h-full rounded-pill"
          style={{ width: `${percent}%`, backgroundColor: colors.primary }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
