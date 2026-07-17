import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ReaderHighlights } from '@/constants/theme';
import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

/** Highlighter colour row, shown above the toolbar when the pen tool is active. */
export function HighlightPalette({ selected, onSelect }: Props) {
  const colors = useTheme();

  return (
    <View
      className="mb-3 flex-row items-center justify-center gap-3 self-center rounded-pill border px-4 py-2.5"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.2),
          shadowColor: colors.shadow,
        },
      ]}>
      {ReaderHighlights.map((color) => {
        const active = color === selected;
        return (
          <TouchableOpacity
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Highlighter colour ${color}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(color)}
            className="h-8 w-8 items-center justify-center rounded-pill"
            style={{
              backgroundColor: color,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.onSurface : withAlpha(colors.outlineVariant, 0.5),
            }}>
            {active ? <AppIcon name="check" size={16} color={colors.onSurface} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
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
