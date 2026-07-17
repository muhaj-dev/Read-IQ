import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { buildMonthCells } from '@/data/deadlines';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  year: number;
  monthIndex: number;
  selectedDay: number;
  /** Days of this month that have a deadline — rendered with a dot underneath. */
  markedDays?: number[];
};

/** Chunk the flat cell list into rows of 7 for week-by-week rendering. */
function toWeeks<T>(cells: T[]): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Month calendar: weekday header + date grid with the selected day circled and
 *  deadline days dotted. */
export function CalendarGrid({ year, monthIndex, selectedDay, markedDays = [] }: Props) {
  const colors = useTheme();
  const weeks = toWeeks(buildMonthCells(year, monthIndex));
  const marked = new Set(markedDays);

  return (
    <View className="gap-4">
      <View className="flex-row">
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center"
            style={[styles.weekday, { color: colors.onSurfaceVariant }]}>
            {day.toUpperCase()}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((cell, cellIndex) => {
            const selected = cell.inMonth && cell.day === selectedDay;
            const isMarked = cell.inMonth && marked.has(cell.day);
            return (
              <View key={cellIndex} className="h-10 flex-1 items-center justify-center">
                {selected ? (
                  <View
                    className="h-10 w-10 items-center justify-center rounded-pill"
                    style={{ backgroundColor: colors.secondaryContainer }}>
                    <Text style={[styles.selectedDay, { color: colors.onPrimary }]}>
                      {cell.day}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.day,
                      cell.inMonth
                        ? { color: colors.onSurface }
                        : { color: colors.onSurfaceVariant, opacity: 0.3 },
                    ]}>
                    {cell.day}
                  </Text>
                )}
                {/* Deadline dot — hidden under the selected-day circle. */}
                {isMarked && !selected ? (
                  <View
                    className="absolute bottom-0.5 h-1 w-1 rounded-pill"
                    style={{ backgroundColor: colors.primary }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekday: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  day: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  selectedDay: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
});
