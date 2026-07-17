import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddFab } from '@/components/deadlines/add-fab';
import { CalendarGrid } from '@/components/deadlines/calendar-grid';
import { DeadlinesHeader } from '@/components/deadlines/deadlines-header';
import { MonthSwitcher } from '@/components/deadlines/month-switcher';
import { UpcomingList } from '@/components/deadlines/upcoming-list';
import { EmptyHint } from '@/components/home/empty-hint';
import { markedDaysInMonth, monthView, toUpcoming } from '@/lib/deadline-view';
import { useTheme } from '@/hooks/use-theme';
import { useDeadlinesStore } from '@/store/use-deadlines-store';

/** DEADLINES — current-month calendar (deadline days dotted) + upcoming list. */
export default function DeadlinesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const deadlines = useDeadlinesStore((s) => s.deadlines);
  const toggleReminder = useDeadlinesStore((s) => s.toggleReminder);
  const removeDeadline = useDeadlinesStore((s) => s.removeDeadline);

  const month = monthView();
  const marked = markedDaysInMonth(deadlines, month.year, month.monthIndex);

  const confirmDelete = (id: string) => {
    const target = deadlines.find((d) => d.id === id);
    Alert.alert('Delete deadline', `Remove “${target?.title ?? 'this deadline'}”?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDeadline(id) },
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <DeadlinesHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View className="gap-4">
            <MonthSwitcher label={month.label} />
            <CalendarGrid
              year={month.year}
              monthIndex={month.monthIndex}
              selectedDay={month.today}
              markedDays={marked}
            />
          </View>

          {deadlines.length > 0 ? (
            <UpcomingList
              deadlines={deadlines.map((d) => toUpcoming(d))}
              onToggleReminder={toggleReminder}
              onDelete={confirmDelete}
            />
          ) : (
            <EmptyHint
              icon="schedule"
              title="No deadlines yet"
              subtitle="Add your exam and assignment dates to see them counted down here."
              cta="Add your first deadline"
              onPress={() => router.push('/deadlines/add')}
            />
          )}
        </ScrollView>

        <AddFab onPress={() => router.push('/deadlines/add')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 96, // keeps the last card clear of the floating + button
    gap: 40,
  },
});
