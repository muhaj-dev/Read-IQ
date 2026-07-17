import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { EditorTextColors } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** The active font colour (from the editor), so the current swatch reads selected. */
  activeColor?: string;
  onSelect: (color: string) => void;
  /** Clears the font colour back to the default ink. */
  onClear: () => void;
};

/** Font-colour swatches, revealed under the toolbar when the text-colour tool is on. */
export function EditorColorRow({ activeColor, onSelect, onClear }: Props) {
  const colors = useTheme();

  return (
    <View
      className="flex-row items-center gap-2 px-2 py-2"
      style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.outlineVariant, 0.4) }}>
      {EditorTextColors.map((color) => {
        const active = color.toLowerCase() === activeColor?.toLowerCase();
        return (
          <TouchableOpacity
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Text colour ${color}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(color)}
            className="h-8 w-8 items-center justify-center rounded-pill"
            style={{
              backgroundColor: color,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.onSurface : withAlpha(colors.outlineVariant, 0.5),
            }}>
            {active ? <AppIcon name="check" size={16} color={colors.onPrimary} /> : null}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Clear text colour"
        onPress={onClear}
        className="h-8 flex-row items-center gap-1 rounded-pill px-3"
        style={{ borderWidth: 1, borderColor: withAlpha(colors.outlineVariant, 0.5) }}>
        <Text style={[styles.clear, { color: colors.onSurfaceVariant }]}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  clear: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
