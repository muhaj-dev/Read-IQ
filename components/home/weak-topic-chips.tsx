import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { WeakTopic } from '@/data/dashboard';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  topics: WeakTopic[];
};

/** Weak-topic chips: red warning chips for failing topics, neutral for shaky. */
export function WeakTopicChips({ topics }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      {topics.map((topic) => {
        const weak = topic.weak;
        return (
          <TouchableOpacity
            key={topic.label}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 rounded-pill px-4 py-2"
            style={{
              backgroundColor: weak ? withAlpha(colors.errorContainer, 0.4) : colors.surfaceContainer,
              borderWidth: 1,
              borderColor: weak ? withAlpha(colors.error, 0.1) : withAlpha(colors.outlineVariant, 0.3),
            }}>
            {weak ? <AppIcon name="warning" size={14} color={colors.error} /> : null}
            <Text
              style={[styles.label, { color: weak ? colors.error : colors.onSurfaceVariant }]}>
              {topic.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
