import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/relative-time';
import type { ChatSession } from '@/types/chat';

type Props = {
  session: ChatSession;
  onOpen: () => void;
  onDelete: () => void;
};

/** One chat-history row: title, first-question preview, last-active time, delete. */
export function SessionCard({ session, onOpen, onDelete }: Props) {
  const colors = useTheme();
  const turns = Math.floor(session.messageCount / 2) || 1;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open chat: ${session.title}`}
      activeOpacity={0.75}
      onPress={onOpen}
      className="flex-row items-center gap-3 rounded-card p-4"
      style={{
        backgroundColor: colors.surfaceLowest,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}>
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <AppIcon name="auto-awesome" size={20} color={colors.secondary} filled />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>
          {session.title}
        </Text>
        {session.preview ? (
          <Text numberOfLines={1} className="mt-0.5" style={[styles.preview, { color: colors.onSurfaceVariant }]}>
            {session.preview}
          </Text>
        ) : null}
        <Text className="mt-1" style={[styles.meta, { color: colors.outline }]}>
          {timeAgo(session.updatedAt)} · {turns} {turns === 1 ? 'question' : 'questions'}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Delete chat: ${session.title}`}
        hitSlop={8}
        onPress={onDelete}
        className="h-9 w-9 items-center justify-center rounded-pill">
        <AppIcon name="delete" size={20} color={colors.outline} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  meta: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bodyMedium,
  },
});
