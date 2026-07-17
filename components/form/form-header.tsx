import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onBack: () => void;
  onSave: () => void;
};

/** Add Deadline top bar: back chevron · small centred title · SAVE in indigo. */
export function FormHeader({ title, onBack, onSave }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row items-center justify-between px-3 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        className="h-11 w-11 items-center justify-center">
        <AppIcon name="chevron-left" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onSave}
        className="h-11 items-center justify-center px-4">
        <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.headingBold,
  },
  save: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
});
