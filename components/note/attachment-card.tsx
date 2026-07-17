import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { NoteAttachmentKind } from '@/types/note';

type Props = {
  name: string;
  /** "32 pages • 2.4 MB" */
  meta: string;
  onRemove: () => void;
  /** Image attachments render a thumbnail instead of the file icon. */
  kind?: NoteAttachmentKind;
  uri?: string;
};

/** One attachment row on Edit Note: file tile / image thumb, name + meta, remove ✕. */
export function AttachmentCard({ name, meta, onRemove, kind = 'file', uri }: Props) {
  const colors = useTheme();

  return (
    <View
      className="flex-row items-center justify-between rounded-lg border p-3"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.4),
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="flex-1 flex-row items-center gap-3">
        {kind === 'image' && uri ? (
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={120} />
        ) : (
          <View
            className="h-10 w-10 items-center justify-center rounded"
            style={{ backgroundColor: colors.surfaceLow }}>
            <AppIcon name={kind === 'image' ? 'image' : 'description'} size={20} color={colors.onSurfaceVariant} />
          </View>
        )}
        <View className="flex-1">
          <Text numberOfLines={1} style={[styles.name, { color: colors.onSurface }]}>
            {name}
          </Text>
          <Text style={[styles.meta, { color: colors.outline }]}>{meta}</Text>
        </View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Remove attachment"
        onPress={onRemove}
        hitSlop={8}
        className="p-1">
        <AppIcon name="close" size={20} color={colors.outlineVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  name: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
});
