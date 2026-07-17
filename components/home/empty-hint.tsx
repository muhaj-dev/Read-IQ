import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: AppIconName;
  title: string;
  subtitle: string;
  /** Optional call-to-action row (e.g. "Add a deadline"). */
  cta?: string;
  onPress?: () => void;
};

/** Calm empty-state card for a dashboard section with no data yet. */
export function EmptyHint({ icon, title, subtitle, cta, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={onPress}
      className="items-center gap-2 rounded-card p-6"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View
        className="mb-1 h-11 w-11 items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <AppIcon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      <Text className="text-center" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
      {cta ? (
        <View className="mt-1 flex-row items-center gap-1">
          <Text style={[styles.cta, { color: colors.secondary }]}>{cta}</Text>
          <AppIcon name="chevron-right" size={16} color={colors.secondary} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  cta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
