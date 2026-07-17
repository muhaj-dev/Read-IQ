import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** Show the ✕ on the right (the chooser can dismiss the whole flow). */
  onClose?: () => void;
};

/** Add-flow top bar: back chevron, centred title, optional close (see the mocks). */
export function AddHeader({ title, onClose }: Props) {
  const colors = useTheme();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  return (
    <View className="flex-row items-center px-3 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={26} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
      <Text className="flex-1 text-center" style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>
      {onClose ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="h-11 w-11 items-center justify-center rounded-pill">
          <AppIcon name="close" size={22} color={colors.onSurfaceVariant} />
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
