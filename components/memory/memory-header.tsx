import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** True while the student is selecting notes (checkbox is filled). */
  selectMode: boolean;
  /** Enter / leave select mode (the top-right checkbox). */
  onToggleSelect: () => void;
};

/** Memory Panel header: title, select checkbox, and "All Notes" scope row. */
export function MemoryHeader({ selectMode, onToggleSelect }: Props) {
  const colors = useTheme();

  return (
    <View className="px-5 pt-2">
      <View className="flex-row items-center justify-between">
        <Text style={[styles.title, { color: colors.onSurface }]}>Memory</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={selectMode ? 'Done selecting notes' : 'Select notes'}
          accessibilityState={{ selected: selectMode }}
          activeOpacity={0.8}
          onPress={onToggleSelect}
          hitSlop={10}>
          <View
            className="h-7 w-7 items-center justify-center rounded-lg"
            style={{
              borderWidth: 1.5,
              borderColor: selectMode ? colors.fab : withAlpha(colors.outlineVariant, 0.7),
              backgroundColor: selectMode ? colors.fab : 'transparent',
            }}>
            {selectMode ? <AppIcon name="check" size={16} color={colors.onPrimary} /> : null}
          </View>
        </TouchableOpacity>
      </View>

      {/* Scope picker is visual-only until note collections exist. */}
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        className="mt-4 flex-row items-center gap-1 self-start">
        <Text style={[styles.scope, { color: colors.onSurfaceVariant }]}>All Notes</Text>
        <AppIcon name="expand-more" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  scope: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
