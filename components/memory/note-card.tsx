import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { MemoryNote, NoteTint } from '@/data/memory-notes';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  note: MemoryNote;
  onPress: () => void;
  /** Show the left selection checkbox (Memory Panel is in select mode). */
  selectable?: boolean;
  /** Whether this note is currently ticked. */
  selected?: boolean;
};

// Tint drives the icon tile — Drive-style file colours from the memory mock.
function tintStyles(tint: NoteTint, colors: ColorTokens) {
  switch (tint) {
    case 'indigo':
      return { wellBg: colors.secondaryFixed, iconColor: colors.primary };
    case 'neutral':
      return { wellBg: colors.surfaceContainerHigh, iconColor: colors.onSurfaceVariant };
    case 'green':
      return { wellBg: colors.noteGreenWell, iconColor: colors.noteGreen };
    case 'amber':
      return { wellBg: colors.noteAmberWell, iconColor: colors.noteAmber };
    case 'red':
      return { wellBg: colors.noteRedWell, iconColor: colors.noteRed };
  }
}

/** One saved note card: icon tile, title, meta, AI-used badge; checkbox in select mode. */
export function NoteCard({ note, onPress, selectable = false, selected = false }: Props) {
  const colors = useTheme();
  const tint = tintStyles(note.tint, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      className="flex-row items-center gap-3 rounded-inner p-4"
      style={[
        styles.card,
        {
          backgroundColor: selected ? withAlpha(colors.fab, 0.06) : colors.surfaceLowest,
          borderColor: selected ? colors.fab : withAlpha(colors.outlineVariant, 0.1),
          shadowColor: colors.shadow,
        },
      ]}>
      {selectable ? (
        <View
          className="h-6 w-6 items-center justify-center rounded-md"
          style={{
            borderWidth: 1.5,
            borderColor: selected ? colors.fab : withAlpha(colors.outlineVariant, 0.7),
            backgroundColor: selected ? colors.fab : 'transparent',
          }}>
          {selected ? <AppIcon name="check" size={15} color={colors.onPrimary} /> : null}
        </View>
      ) : null}

      <View
        className="h-12 w-12 items-center justify-center self-start rounded-lg"
        style={{ backgroundColor: tint.wellBg }}>
        <AppIcon name={note.icon} size={24} color={tint.iconColor} filled />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text numberOfLines={1} className="flex-1" style={[styles.title, { color: colors.onSurface }]}>
            {note.title}
          </Text>
          <Text className="ml-2 mt-1" style={[styles.when, { color: colors.outline }]}>
            {note.when}
          </Text>
        </View>
        <Text className="mt-0.5" style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {note.meta}
        </Text>

        {/* Proof of memory: how often the AI has answered from this note. */}
        <View
          className="mt-3 self-start rounded-lg px-2.5 py-1"
          style={{ backgroundColor: withAlpha(colors.surfaceVariant, 0.4) }}>
          <Text style={[styles.badge, { color: colors.secondary }]}>
            AI used {note.aiUsedCount} times
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
  },
  when: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  badge: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
