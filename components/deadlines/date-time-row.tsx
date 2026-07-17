import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  date: string;
  time: string;
  onDatePress: () => void;
  onTimePress: () => void;
};

function PickerBox({
  value,
  icon,
  onPress,
}: {
  value: string;
  icon: AppIconName;
  onPress: () => void;
}) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      className="h-12 flex-1 flex-row items-center justify-between rounded-lg px-4"
      style={[styles.box, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
      <Text style={[styles.value, { color: colors.onSurface }]}>{value}</Text>
      <AppIcon name={icon} size={20} color={colors.outline} />
    </TouchableOpacity>
  );
}

/** Due Date row: tappable date box + time box side by side (each opens a sheet). */
export function DateTimeRow({ date, time, onDatePress, onTimePress }: Props) {
  return (
    <View className="flex-row gap-3">
      <PickerBox value={date} icon="calendar-month" onPress={onDatePress} />
      <PickerBox value={time} icon="schedule" onPress={onTimePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
});
