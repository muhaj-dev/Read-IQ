import { StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/home/section-header';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Source notes behind the questions the student got wrong. */
  topics: string[];
};

/** "Topics to review" — chips for missed notes, or a win line on a clean sweep. */
export function ResultTopics({ topics }: Props) {
  const colors = useTheme();

  if (topics.length === 0) {
    return (
      <View className="flex-row items-center gap-2 px-1">
        <AppIcon name="check-circle" size={20} color={colors.quizCheck} filled />
        <Text style={[styles.clear, { color: colors.quizCheck }]}>
          You aced it — nothing to review!
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <SectionHeader title="Topics to review" />
      <View className="flex-row flex-wrap gap-2">
        {topics.map((topic) => (
          <View
            key={topic}
            className="flex-row items-center gap-1.5 rounded-pill px-4 py-2"
            style={{
              backgroundColor: colors.topicAmberBg,
              borderWidth: 1,
              borderColor: colors.topicAmberBorder,
            }}>
            <AppIcon name="warning" size={14} color={colors.topicAmberInk} />
            <Text style={[styles.chip, { color: colors.topicAmberInk }]}>{topic}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clear: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  chip: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
