import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { DashboardDeadline, DeadlineUrgency } from '@/data/dashboard';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  deadlines: DashboardDeadline[];
};

// Urgency drives the icon well, icon colour, and badge.
function urgencyStyles(urgency: DeadlineUrgency, colors: ColorTokens) {
  if (urgency === 'today') {
    return {
      wellBg: withAlpha(colors.errorContainer, 0.3),
      iconColor: colors.error,
      badgeBg: withAlpha(colors.errorContainer, 0.3),
      badgeColor: colors.error,
      badgeFont: fonts.bodyBold,
    };
  }
  if (urgency === 'soon') {
    return {
      wellBg: colors.surfaceContainer,
      iconColor: colors.primary,
      badgeBg: colors.surfaceContainer,
      badgeColor: colors.primary,
      badgeFont: fonts.bodyBold,
    };
  }
  return {
    wellBg: colors.surfaceContainer,
    iconColor: colors.primary,
    badgeBg: colors.surfaceVariant,
    badgeColor: colors.onSurfaceVariant,
    badgeFont: fonts.bodyMedium,
  };
}

/** The "Upcoming Deadlines" card — one row per deadline with urgency badge. */
export function DeadlineList({ deadlines }: Props) {
  const colors = useTheme();

  return (
    <View
      className="overflow-hidden rounded-card"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      {deadlines.map((deadline, index) => {
        const tone = urgencyStyles(deadline.urgency, colors);
        const isLast = index === deadlines.length - 1;

        return (
          <TouchableOpacity
            key={deadline.id}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
            style={
              isLast
                ? undefined
                : { borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outlineVariant, 0.2) }
            }>
            <View className="flex-row items-start gap-3">
              <View
                className="h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: tone.wellBg }}>
                <AppIcon name={deadline.icon} size={20} color={tone.iconColor} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.onSurface }]}>{deadline.title}</Text>
                <Text className="mt-0.5" style={[styles.when, { color: colors.onSurfaceVariant }]}>
                  {deadline.when}
                </Text>
              </View>
            </View>

            <View className="rounded px-2 py-1" style={{ backgroundColor: tone.badgeBg }}>
              <Text style={[styles.badge, { color: tone.badgeColor, fontFamily: tone.badgeFont }]}>
                {deadline.badge}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
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
  when: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
  badge: {
    fontSize: 12,
    lineHeight: 16,
  },
});
