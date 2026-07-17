import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/** Floating undo/redo pill in the reader; buttons dim when there's nothing left. */
export function ReaderHistoryBar({ canUndo, canRedo, onUndo, onRedo }: Props) {
  const colors = useTheme();

  return (
    <View
      className="flex-row items-center gap-1 rounded-pill border p-1"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.2),
          shadowColor: colors.shadow,
        },
      ]}>
      <HistoryButton icon="undo" label="Undo" enabled={canUndo} onPress={onUndo} />
      <View style={{ width: 1, height: 20, backgroundColor: withAlpha(colors.outlineVariant, 0.3) }} />
      <HistoryButton icon="redo" label="Redo" enabled={canRedo} onPress={onRedo} />
    </View>
  );
}

function HistoryButton({
  icon,
  label,
  enabled,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      hitSlop={6}
      className="h-9 w-9 items-center justify-center rounded-pill">
      <AppIcon
        name={icon}
        size={20}
        color={enabled ? colors.onSurfaceVariant : withAlpha(colors.outlineVariant, 0.6)}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
});
