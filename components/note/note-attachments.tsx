import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { NoteAttachment } from '@/types/note';

type Props = {
  attachments: NoteAttachment[];
};

/** Read-only Attachments section on Note Details; hidden when the note has none. */
export function NoteAttachments({ attachments }: Props) {
  const colors = useTheme();
  if (attachments.length === 0) return null;

  return (
    <View>
      <Text className="mb-3" style={[styles.sectionHeading, { color: colors.onSurface }]}>
        Attachments
      </Text>
      <View className="gap-2">
        {attachments.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center gap-3 rounded-lg border p-3"
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceLowest,
                borderColor: withAlpha(colors.outlineVariant, 0.4),
                shadowColor: colors.shadow,
              },
            ]}>
            {item.kind === 'image' && item.uri ? (
              <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" transition={120} />
            ) : (
              <View
                className="h-11 w-11 items-center justify-center rounded"
                style={{ backgroundColor: colors.surfaceLow }}>
                <AppIcon
                  name={item.kind === 'image' ? 'image' : 'description'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </View>
            )}
            <View className="flex-1">
              <Text numberOfLines={1} style={[styles.name, { color: colors.onSurface }]}>
                {item.name}
              </Text>
              <Text style={[styles.meta, { color: colors.outline }]}>{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>
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
  sectionHeading: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
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
