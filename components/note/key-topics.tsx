import { StyleSheet, Text, View } from 'react-native';

import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { KeyTopic, TopicTone } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  topics: KeyTopic[];
};

// Tone → the soft bg / dark ink / pale border trio from the note-details mock.
function toneStyles(tone: TopicTone, colors: ColorTokens) {
  switch (tone) {
    case 'green':
      return { bg: colors.topicGreenBg, ink: colors.topicGreenInk, border: colors.topicGreenBorder };
    case 'red':
      return { bg: colors.topicRedBg, ink: colors.topicRedInk, border: colors.topicRedBorder };
    case 'amber':
      return { bg: colors.topicAmberBg, ink: colors.topicAmberInk, border: colors.topicAmberBorder };
    case 'blue':
      return { bg: colors.topicBlueBg, ink: colors.topicBlueInk, border: colors.topicBlueBorder };
  }
}

/** The Key Topics chip cloud on Note Details. */
export function KeyTopics({ topics }: Props) {
  const colors = useTheme();

  return (
    <View>
      <Text className="mb-3" style={[styles.heading, { color: colors.onSurface }]}>
        Key Topics
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {topics.map((topic) => {
          const tone = toneStyles(topic.tone, colors);
          return (
            <View
              key={topic.label}
              className="rounded-inner border px-4 py-2"
              style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
              <Text style={[styles.chip, { color: tone.ink }]}>{topic.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  chip: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
