import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// Route name → Material glyph.
const TAB_ICONS: Record<string, AppIconName> = {
  home: 'home',
  ask: 'auto-awesome',
  memory: 'psychology',
  profile: 'person',
};

/** Custom bottom nav; active tab in an indigo pill, raised center Add button. */
export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const colors = useTheme();
  const router = useRouter();

  // Ask AI is full-bleed with its own input, so it hides the tab bar.
  if (state.routes[state.index]?.name === 'ask') return null;

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const label = descriptors[route.key].options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        onPress={onPress}
        className="items-center justify-center rounded-inner px-5 py-1.5"
        style={focused && { backgroundColor: colors.fab }}>
        <AppIcon
          name={TAB_ICONS[route.name] ?? 'description'}
          size={24}
          color={focused ? colors.onPrimary : colors.onSurfaceVariant}
          filled={focused}
        />
        <Text
          className="mt-1"
          style={[
            styles.label,
            { color: focused ? colors.onPrimary : colors.onSurfaceVariant },
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  });

  // The + Add button sits between Ask and Memory; only gently raised.
  tabs.splice(
    2,
    0,
    <View key="add" className="-top-3">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add note"
        activeOpacity={0.85}
        onPress={() => router.push('/add')}
        className="h-[68px] w-[68px] items-center justify-center rounded-pill"
        style={[styles.addButton, { backgroundColor: colors.fab, shadowColor: colors.fab }]}>
        <AppIcon name="add" size={36} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>,
  );

  return (
    <View
      className="flex-row items-center justify-around rounded-t-inner"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: withAlpha(colors.outlineVariant, 0.2),
          shadowColor: colors.shadow,
          // Slim 64px row + bottom inset to clear Android's nav bar.
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}>
      {tabs}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  addButton: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
