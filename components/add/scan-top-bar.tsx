import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { CameraChrome } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  /** The crop button shows/hides the framing overlay. */
  onToggleFrame: () => void;
};

/** Dark header floating over the camera: back · Scan Page · frame toggle. */
export function ScanTopBar({ onToggleFrame }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/add');
  };

  return (
    <View className="flex-row items-center justify-between px-5 py-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={26} color={CameraChrome.icon} />
      </TouchableOpacity>
      <Text style={styles.title}>Scan Page</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Toggle framing guides"
        onPress={onToggleFrame}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="crop-free" size={24} color={CameraChrome.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
    color: CameraChrome.icon,
  },
});
