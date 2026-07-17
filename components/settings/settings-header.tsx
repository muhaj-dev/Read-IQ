import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** Data & Privacy tints the chevron + title in primary. */
  accent?: boolean;
};

/** Settings top bar: back chevron · small centred title · trailing spacer. */
export function SettingsHeader({ title, accent = false }: Props) {
  const colors = useTheme();
  const router = useRouter();
  const ink = accent ? colors.primary : colors.onSurface;

  const back = () => (router.canGoBack() ? router.back() : router.navigate('/profile'));

  return (
    <View className="flex-row items-center justify-between px-3 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={back}
        className="h-11 w-11 items-center justify-center">
        <AppIcon name="chevron-left" size={24} color={accent ? colors.primary : colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: ink }]}>{title}</Text>

      {/* Spacer mirrors the back button so the title stays centred. */}
      <View className="h-11 w-11" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.headingBold,
  },
});
