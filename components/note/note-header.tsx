import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** Details/Reader tint the chevron + title indigo; Options keeps them dark. */
  tinted?: boolean;
  /** Optional right-side icon action (the Details screen's edit pencil). */
  action?: { icon: AppIconName; label: string; onPress: () => void };
};

/** Note-page top bar: back chevron, centred title, optional icon action. */
export function NoteHeader({ title, tinted = false, action }: Props) {
  const colors = useTheme();
  const router = useRouter();
  const ink = tinted ? colors.primary : colors.onSurface;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/memory');
  };

  return (
    <View className="flex-row items-center px-3 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={26} color={ink} />
      </TouchableOpacity>
      <Text className="flex-1 text-center" style={[styles.title, { color: ink }]}>
        {title}
      </Text>
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          className="h-11 w-11 items-center justify-center rounded-pill">
          <AppIcon name={action.icon} size={22} color={ink} />
        </TouchableOpacity>
      ) : (
        // Spacer mirrors the back button so the title stays optically centred.
        <View className="h-11 w-11" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
});
