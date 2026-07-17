import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { AnnotationMode } from '@/data/note-annotations';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  mode: AnnotationMode;
  /** Toggle a tool on, or back to plain reading when tapped while active. */
  onSetMode: (mode: AnnotationMode) => void;
  onListen: () => void;
};

/** Floating pill over the Note Reader: highlight, comment, and Broadcast tools. */
export function ReaderToolbar({ mode, onSetMode, onListen }: Props) {
  const colors = useTheme();

  const toggle = (target: AnnotationMode) => () => onSetMode(mode === target ? 'view' : target);

  return (
    <View
      className="flex-row items-center justify-around rounded-pill border px-4 py-2.5"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.2),
          shadowColor: colors.shadow,
        },
      ]}>
      <Tool
        icon="edit"
        label="Highlight"
        active={mode === 'highlight'}
        onPress={toggle('highlight')}
      />
      <Tool
        icon="comment"
        label="Comment"
        active={mode === 'comment'}
        onPress={toggle('comment')}
      />
      <Tool icon="headphones" label="Broadcast" active={false} onPress={onListen} />
    </View>
  );
}

function Tool({
  icon,
  label,
  active,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="items-center justify-center gap-1 px-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-pill"
        style={active ? { backgroundColor: colors.secondaryContainer } : undefined}>
        <AppIcon name={icon} size={22} color={active ? colors.onPrimary : colors.onSurfaceVariant} />
      </View>
      <Text style={[styles.caption, { color: active ? colors.primary : colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    // 0 8px 32px rgba(46,49,146,.12) from the mock.
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bodyMedium,
  },
});
