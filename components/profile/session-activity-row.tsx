import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/relative-time';
import type { StudyActivity } from '@/lib/profile-stats';

type Props = {
  activity: StudyActivity;
};

/** Icon + colour well per activity kind: Ask sessions green, quizzes blue. */
function kindStyle(kind: StudyActivity['kind'], colors: ColorTokens): {
  icon: AppIconName;
  tint: string;
  well: string;
} {
  if (kind === 'quiz') return { icon: 'quiz', tint: colors.menuBlue, well: colors.menuBlueWell };
  return { icon: 'auto-awesome', tint: colors.menuGreen, well: colors.menuGreenWell };
}

/** One study-timeline row: an Ask chat or a finished quiz with its time. */
export function SessionActivityRow({ activity }: Props) {
  const colors = useTheme();
  const { icon, tint, well } = kindStyle(activity.kind, colors);

  return (
    <View
      className="flex-row items-center gap-3 rounded-card p-4"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceLow, shadowColor: colors.shadow },
      ]}>
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: well }}>
        <AppIcon name={icon} size={20} color={tint} filled={activity.kind === 'ask'} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>
          {activity.title}
        </Text>
        <Text className="mt-0.5" style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {activity.subtitle}
        </Text>
      </View>

      <Text style={[styles.time, { color: colors.outline }]}>{timeAgo(activity.at)}</Text>
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
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  time: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bodyMedium,
  },
});
