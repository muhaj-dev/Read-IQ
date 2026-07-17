import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { DeadlineUrgency, UpcomingDeadline } from '@/data/deadlines';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  deadlines: UpcomingDeadline[];
  /** Toggle a deadline's reminder on/off (the bell). */
  onToggleReminder: (id: string) => void;
  /** Long-press a card to delete it. */
  onDelete: (id: string) => void;
};

// Mock: "Due today" red, "1 day left" orange, "3 days left" indigo.
function statusColor(urgency: DeadlineUrgency, colors: ColorTokens) {
  if (urgency === 'today') return colors.error;
  if (urgency === 'soon') return colors.dueSoon;
  return colors.primary;
}

/** "Upcoming" section: one card per deadline with a coloured countdown, a
 *  reminder bell you can toggle, and long-press to delete. */
export function UpcomingList({ deadlines, onToggleReminder, onDelete }: Props) {
  const colors = useTheme();

  return (
    <View className="gap-3">
      <Text style={[styles.heading, { color: colors.onSurface }]}>Upcoming</Text>

      {deadlines.map((deadline) => (
        <TouchableOpacity
          key={deadline.id}
          activeOpacity={0.7}
          onLongPress={() => onDelete(deadline.id)}
          className="flex-row items-center justify-between rounded-inner p-5"
          style={[styles.card, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
          <View className="flex-1 gap-1">
            <Text style={[styles.title, { color: colors.onSurface }]}>{deadline.title}</Text>
            <Text style={[styles.when, { color: colors.onSurfaceVariant }]}>{deadline.when}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text style={[styles.status, { color: statusColor(deadline.urgency, colors) }]}>
              {deadline.status}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={deadline.reminderOn ? 'Turn reminder off' : 'Turn reminder on'}
              accessibilityState={{ selected: deadline.reminderOn }}
              hitSlop={10}
              onPress={() => onToggleReminder(deadline.id)}
              className="h-9 w-9 items-center justify-center rounded-pill"
              style={{
                backgroundColor: deadline.reminderOn ? withAlpha(colors.primary, 0.12) : 'transparent',
              }}>
              <AppIcon
                name="notifications"
                size={20}
                color={deadline.reminderOn ? colors.primary : colors.outline}
                filled={deadline.reminderOn}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    fontFamily: fonts.bodyMedium,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
