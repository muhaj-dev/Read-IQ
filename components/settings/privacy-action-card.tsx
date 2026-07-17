import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { PrivacyAction } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  action: PrivacyAction;
  onPress?: () => void;
};

/** One Data & Privacy card: round icon well · title + subtitle · chevron. */
export function PrivacyActionCard({ action, onPress }: Props) {
  const colors = useTheme();
  const danger = action.tone === 'danger';

  const well = danger ? colors.errorContainer : colors.surfaceContainer;
  const icon = danger ? colors.error : colors.primary;
  const title = danger ? colors.error : colors.onSurface;
  const subtitle = danger ? colors.onErrorContainer : colors.onSurfaceVariant;
  const trailing = danger ? colors.error : colors.outline;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-inner p-5"
      style={[styles.card, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
      <View className="flex-row items-center gap-4">
        <View
          className="h-10 w-10 items-center justify-center rounded-pill"
          style={{ backgroundColor: well }}>
          <AppIcon name={action.icon} size={24} color={icon} />
        </View>
        <View>
          <Text style={[styles.title, { color: title }]}>{action.title}</Text>
          {action.subtitle ? (
            <Text style={[styles.subtitle, { color: subtitle }]}>{action.subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {action.value ? (
          <Text style={[styles.value, { color: colors.outline }]}>{action.value}</Text>
        ) : null}
        <AppIcon name="chevron-right" size={20} color={trailing} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.headingSemibold,
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
  },
});
