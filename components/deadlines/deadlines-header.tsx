import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

/** Deadlines top bar: back chevron, centred title, calendar button — all indigo per the mock. */
export function DeadlinesHeader() {
  const colors = useTheme();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  return (
    <View className="flex-row items-center justify-between px-5 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-10 w-10 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={24} color={colors.primary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.onSurface }]}>Deadlines</Text>

      {/* Calendar/list view toggle is visual-only until deadlines have a list view. */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Calendar view"
        className="h-10 w-10 items-center justify-center rounded-pill">
        <AppIcon name="calendar-today" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingSemibold,
  },
});
