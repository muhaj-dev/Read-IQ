import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { SettingsRowItem } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  item: SettingsRowItem;
  /** All rows except the last draw a hairline divider underneath. */
  divider: boolean;
  /** Toggle rows only. */
  toggled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

/** One Settings row: leading icon + label · trailing value + chevron, or a switch. */
export function SettingsRow({ item, divider, toggled = false, onToggle, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      disabled={item.kind === 'toggle'}
      onPress={onPress}
      className="flex-row items-center justify-between p-5"
      style={
        divider && {
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.outlineVariant, 0.5),
        }
      }>
      <View className="flex-row items-center gap-4">
        <AppIcon name={item.icon} size={24} color={colors.outline} />
        <View>
          <Text style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {item.kind === 'toggle' ? (
        // Switch is a native control → props, not className.
        <Switch
          accessibilityLabel={item.title}
          value={toggled}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
          thumbColor={colors.onPrimary}
          ios_backgroundColor={colors.surfaceVariant}
          // react-native-web colours the checked thumb separately (defaults teal).
          {...{ activeThumbColor: colors.onPrimary }}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {item.value ? (
            <Text style={[styles.value, { color: colors.onSurfaceVariant }]}>{item.value}</Text>
          ) : null}
          <AppIcon name="chevron-right" size={16} color={colors.outlineVariant} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.1,
  },
});
