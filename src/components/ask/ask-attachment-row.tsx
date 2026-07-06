import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { ChatAttachment } from '@/types/chat';

type Props = {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
};

/** Attached-image thumbnails above the composer, each with an × to drop it. */
export function AskAttachmentRow({ attachments, onRemove }: Props) {
  const colors = useTheme();
  if (attachments.length === 0) return null;

  return (
    <View className="mb-2 flex-row flex-wrap gap-2 px-1">
      {attachments.map((a) => (
        <View key={a.id}>
          <Image
            source={{ uri: a.uri }}
            style={[styles.thumb, { borderColor: colors.outlineVariant }]}
            contentFit="cover"
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Remove image"
            activeOpacity={0.85}
            hitSlop={8}
            onPress={() => onRemove(a.id)}
            style={[styles.remove, { backgroundColor: withAlpha(colors.onSurface, 0.75) }]}>
            <AppIcon name="close" size={14} color={colors.surfaceLowest} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
