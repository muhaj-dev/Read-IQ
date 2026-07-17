import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle: string;
};

/** Centred headline + subtitle above the subject list on the Quiz Home screen. */
export function QuizIntro({ title, subtitle }: Props) {
  const colors = useTheme();

  return (
    <View className="items-center">
      <Text className="text-center" style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>
      <Text
        className="mt-2 text-center"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    maxWidth: 300,
  },
});
