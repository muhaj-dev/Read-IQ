import { StyleSheet, Text } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  prompt: string;
};

/** The current question, shown large and bold. */
export function QuizQuestion({ prompt }: Props) {
  const colors = useTheme();
  return <Text style={[styles.prompt, { color: colors.primary }]}>{prompt}</Text>;
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.headingBold,
  },
});
