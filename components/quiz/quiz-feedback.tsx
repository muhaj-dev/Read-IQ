import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  correct: boolean;
};

/** Post-answer line: a sparkle plus an encouraging or corrective message. */
export function QuizFeedback({ correct }: Props) {
  const colors = useTheme();

  return (
    <View className="mt-1 flex-row items-center gap-2">
      <AppIcon name="auto-awesome" size={20} color={colors.quizSparkle} filled />
      <Text
        style={[styles.text, { color: correct ? colors.quizCheck : colors.error }]}>
        {correct ? 'Great job!' : 'Not quite — the answer is highlighted above.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
