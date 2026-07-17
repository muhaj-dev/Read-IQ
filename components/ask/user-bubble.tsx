import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { ChatAttachment } from '@/types/chat';

type Props = {
  text: string;
  time: string;
  /** Images the student attached to this question — shown above the text. */
  attachments?: ChatAttachment[];
};

/** Right-aligned indigo bubble for the student's question (with any attached images). */
export function UserBubble({ text, time, attachments }: Props) {
  const colors = useTheme();
  const hasImages = !!attachments?.length;

  return (
    <View className="items-end">
      <View
        className="max-w-[85%] rounded-card p-4"
        style={[
          styles.bubble,
          { backgroundColor: colors.secondaryContainer, shadowColor: colors.shadow },
        ]}>
        {hasImages ? (
          <View className={text ? 'mb-3 flex-row flex-wrap gap-2' : 'flex-row flex-wrap gap-2'}>
            {attachments.map((a) => (
              <Image
                key={a.id}
                source={{ uri: a.uri }}
                style={[styles.image, { borderColor: withAlpha(colors.onPrimary, 0.25) }]}
                contentFit="cover"
              />
            ))}
          </View>
        ) : null}
        {text ? <Text style={[styles.text, { color: colors.onPrimary }]}>{text}</Text> : null}
        <Text
          className="mt-2 text-right"
          style={[styles.time, { color: withAlpha(colors.onPrimary, 0.8) }]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderTopRightRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 132,
    height: 132,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodyRegular,
  },
  time: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bodyRegular,
  },
});
