import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { NoteIqMark } from '@/components/brand/brand-logo';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  name: string;
  streakDays: number;
  /** Tapping the logo + greeting opens the Profile tab. */
  onPressBrand?: () => void;
};

/** Time-of-day greeting so the header always feels current. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

/** Dashboard top bar: logo + greeting on the left (opens Profile), streak pill right. */
export function HomeHeader({ name, streakDays, onPressBrand }: Props) {
  const colors = useTheme();

  return (
    <View
      className="h-16 flex-row items-center justify-between px-4"
      style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outlineVariant, 0.3) }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        activeOpacity={0.7}
        onPress={onPressBrand}
        className="flex-row items-center gap-3">
        <NoteIqMark width={28} />
        <View>
          <Text style={[styles.greeting, { color: colors.onSurfaceVariant }]}>{greeting()}</Text>
          <Text style={[styles.name, { color: colors.primary }]}>{name} 👋</Text>
        </View>
      </TouchableOpacity>

      <View
        className="flex-row items-center gap-2 rounded-pill px-3 py-1"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <AppIcon name="flame" size={14} color={colors.flame} />
        <Text style={[styles.streak, { color: colors.primary }]}>{streakDays} day streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
  name: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  streak: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyBold,
  },
});
