import { StyleSheet, Text, View } from 'react-native';

import { AnswerBody } from '@/components/ask/answer-body';
import { TypingDots } from '@/components/ask/typing-dots';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** The answer text — grows token by token while `streaming`. */
  text: string;
  /** Wall-clock label, shown once the answer settles. */
  time: string;
  /** Tokens are still arriving. */
  streaming?: boolean;
  /** This bubble holds a friendly runtime-error message, not an answer. */
  error?: boolean;
  /** Answer from outside the notes — shows the distinct "Beyond your notes" header. */
  beyond?: boolean;
};

/** Left-aligned card holding noteIQ's answer; "beyond" answers use a distinct blue well. */
export function AiBubble({ text, time, streaming, error, beyond }: Props) {
  const colors = useTheme();
  const waiting = streaming && text.length === 0;

  return (
    <View className="items-start">
      {beyond ? (
        <View className="mb-1 ml-1 flex-row items-center gap-1">
          <AppIcon name="language" size={13} color={colors.topicBlueInk} />
          <Text style={[styles.sender, { color: colors.topicBlueInk }]}>
            Beyond your notes · general knowledge
          </Text>
        </View>
      ) : (
        <Text className="mb-1 ml-1" style={[styles.sender, { color: colors.primary }]}>
          readIQ
        </Text>
      )}
      <View
        className="max-w-[90%] gap-3 rounded-card p-4"
        style={[
          styles.bubble,
          {
            backgroundColor: beyond ? colors.topicBlueBg : colors.surfaceLowest,
            borderColor: beyond ? colors.topicBlueBorder : colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        {waiting ? (
          <TypingDots />
        ) : (
          <>
            {error ? (
              <View className="flex-row items-center gap-1.5">
                <AppIcon name="warning" size={16} color={colors.error} />
                <Text style={[styles.errorLabel, { color: colors.error }]}>Couldn’t answer</Text>
              </View>
            ) : null}
            <AnswerBody text={text} />
          </>
        )}
        {!streaming && !waiting && time ? (
          <Text className="text-right" style={[styles.time, { color: colors.outline }]}>
            {time}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sender: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyBold,
  },
  bubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  errorLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
  time: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bodyRegular,
  },
});
