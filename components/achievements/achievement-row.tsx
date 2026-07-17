import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { EvaluatedAchievement } from '@/lib/achievements';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  achievement: EvaluatedAchievement;
};

/** One badge row — coloured + checked when earned, muted while locked. */
export function AchievementRow({ achievement }: Props) {
  const colors = useTheme();
  const { unlocked, icon, title, description } = achievement;

  const iconColor = unlocked ? colors.menuPurple : colors.onSurfaceVariant;
  const wellBg = unlocked ? colors.menuPurpleWell : colors.surfaceContainer;

  return (
    <View
      className="flex-row items-center gap-4 rounded-card p-4"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: colors.surfaceLow,
          shadowColor: colors.shadow,
          opacity: unlocked ? 1 : 0.7,
        },
      ]}>
      <View className="h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: wellBg }}>
        <AppIcon name={icon} size={24} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text className="mt-0.5" style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {description}
        </Text>
      </View>

      {unlocked ? (
        <AppIcon name="check-circle" size={22} color={colors.quizCheck} filled />
      ) : (
        <View
          className="h-5 w-5 rounded-full"
          style={{ borderWidth: 2, borderColor: withAlpha(colors.onSurfaceVariant, 0.4) }}
        />
      )}
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
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
});
