import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { OnboardIcon } from '@/components/onboarding/onboard-icon';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  /** The note text being drafted — word count derives from it live. */
  text: string;
  /** The student's chosen save name; falls back to the note's first line. */
  title?: string;
};

/** "Note landing in memory" preview: arrow into a saved-note card, fades in. */
export function SavedNoteCard({ text, title }: Props) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const displayTitle = title?.trim() ? title.trim() : deriveTitle(text);

  return (
    <Animated.View
      entering={FadeInDown.duration(450)}
      exiting={FadeOut.duration(200)}
      className="items-center px-5">
      <View className="mb-2 h-6 items-center justify-center">
        <OnboardIcon name="arrow-downward" size={16} color={Onboard.outlineVariant} />
      </View>

      <View className="w-full flex-row items-center justify-between rounded-inner p-3" style={styles.card}>
        <View className="flex-1 flex-row items-center gap-3 pr-2">
          <View
            className="h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: Onboard.surfaceVariant }}>
            <OnboardIcon name="description" size={20} color={Onboard.primary} />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} style={styles.title}>
              {displayTitle}
            </Text>
            <Text className="mt-0.5" style={styles.meta}>
              Just now • {words} {words === 1 ? 'word' : 'words'}
            </Text>
          </View>
        </View>

        <View
          className="h-8 w-8 items-center justify-center rounded-pill"
          style={{ backgroundColor: Onboard.surfaceLow }}>
          <OnboardIcon name="check-circle" size={18} color={Onboard.success} />
        </View>
      </View>
    </Animated.View>
  );
}

/** First line of the note, cut at a word boundary so the card title stays short. */
function deriveTitle(text: string): string {
  const line = text.trim().split('\n')[0];
  if (line.length <= 26) return line;
  const cut = line.slice(0, 26);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 10 ? lastSpace : 26)}…`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Onboard.surfaceLowest,
    borderWidth: 1,
    borderColor: Onboard.borderFaint,
    shadowColor: Onboard.primaryContainer,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurface,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
    color: Onboard.outline,
  },
});
