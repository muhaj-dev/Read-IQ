import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: AppIconName;
  title: string;
  message: string;
  /** Optional action button below the message (e.g. "Go back"). */
  action?: { label: string; onPress: () => void };
};

/** Friendly centered empty-state placeholder for a screen. */
export function TabPlaceholder({ icon, title, message, action }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView style={styles.safe}>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-4 h-16 w-16 items-center justify-center rounded-pill"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <AppIcon name={icon} size={28} color={colors.primary} />
          </View>
          <Text className="mb-2" style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>
          {action ? (
            <TouchableOpacity
              onPress={action.onPress}
              className="mt-6 items-center justify-center rounded-btn px-6 py-3"
              style={{ backgroundColor: colors.primaryContainer }}>
              <Text style={[styles.actionLabel, { color: colors.onPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyRegular,
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
