import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type OptionStatus = 'idle' | 'correct' | 'wrong';

type Props = {
  letter: string;
  text: string;
  status: OptionStatus;
  /** Disabled once an answer is locked in. */
  disabled: boolean;
  onPress: () => void;
};

/** One MCQ answer card; correct turns green, wrong turns red. */
export function QuizOption({ letter, text, status, disabled, onPress }: Props) {
  const colors = useTheme();
  const s = palette(colors)[status];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.9}
      disabled={disabled}
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-card p-5"
      style={[
        styles.card,
        {
          backgroundColor: s.bg,
          borderColor: s.border,
          borderWidth: status === 'idle' ? 1 : 2,
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="flex-1 flex-row items-center gap-4">
        <View
          className="h-10 w-10 items-center justify-center rounded-pill"
          style={{ backgroundColor: s.well }}>
          <Text style={[styles.letter, { color: s.letterInk }]}>{letter}</Text>
        </View>
        <Text style={[styles.text, { color: s.text }]}>{text}</Text>
      </View>
      {status === 'correct' && <AppIcon name="check" size={22} color={colors.quizCheck} />}
      {status === 'wrong' && <AppIcon name="close" size={22} color={colors.error} />}
    </TouchableOpacity>
  );
}

const palette = (colors: ReturnType<typeof useTheme>) => ({
  idle: {
    bg: colors.surfaceLowest,
    border: 'transparent',
    well: colors.surfaceLow,
    letterInk: colors.onSurfaceVariant,
    text: colors.onSurface,
  },
  correct: {
    bg: colors.quizCorrectBg,
    border: colors.quizCorrect,
    well: colors.quizCorrectWell,
    letterInk: colors.quizCorrectInk,
    text: colors.quizCorrectText,
  },
  wrong: {
    bg: withAlpha(colors.error, 0.08),
    border: colors.error,
    well: withAlpha(colors.error, 0.16),
    letterInk: colors.error,
    text: colors.error,
  },
});

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  letter: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  text: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
});
