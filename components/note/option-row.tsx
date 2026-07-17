import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { NoteOption } from '@/data/note-options';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  option: NoteOption;
  /** All rows except the last draw a hairline divider underneath. */
  divider: boolean;
  /** Toggle rows only. */
  toggled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

/** One row of the Note Options menu card (chevron, toggle, or danger). */
export function OptionRow({ option, divider, toggled = false, onToggle, onPress }: Props) {
  const colors = useTheme();
  const ink = option.kind === 'danger' ? colors.error : colors.onSurface;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      disabled={option.kind === 'toggle'}
      onPress={onPress}
      className="flex-row items-center p-4"
      style={
        divider && {
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.outlineVariant, 0.2),
        }
      }>
      <View className="w-10">
        <AppIcon name={option.icon} size={22} color={ink} />
      </View>

      <View className="flex-1">
        <Text style={[styles.title, { color: ink }]}>{option.title}</Text>
        {option.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.outline }]}>{option.subtitle}</Text>
        ) : null}
      </View>

      {option.kind === 'toggle' ? (
        // Switch is a native control → props, not className.
        <Switch
          accessibilityLabel={option.title}
          value={toggled}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
          thumbColor={colors.onPrimary}
          ios_backgroundColor={colors.surfaceVariant}
          // react-native-web colours the checked thumb separately (defaults teal).
          {...{ activeThumbColor: colors.onPrimary }}
        />
      ) : (
        <AppIcon name="chevron-right" size={20} color={colors.outlineVariant} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
});
