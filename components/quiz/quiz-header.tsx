import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Centred title — defaults to "Quiz". */
  title?: string;
  /** Called when the ✕ is tapped — exits the quiz. Defaults to router.back(). */
  onClose?: () => void;
};

/** Quiz top bar: back chevron, centred title in indigo, close ✕. */
export function QuizHeader({ title = 'Quiz', onClose }: Props) {
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
      <Text className="flex-1 text-center" style={[styles.title, { color: colors.primary }]}>
        {title}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close quiz"
        onPress={onClose ?? goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="close" size={22} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingSemibold,
  },
});
