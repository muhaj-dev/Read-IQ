import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onRetry: () => void;
  onHome: () => void;
};

/** Result CTAs — retry the same quiz (primary) or head back to the dashboard. */
export function ResultActions({ onRetry, onHome }: Props) {
  const colors = useTheme();

  return (
    <View className="gap-3">
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.9}
        onPress={onRetry}
        className="w-full flex-row items-center justify-center gap-2 rounded-card py-4"
        style={[styles.primary, { backgroundColor: colors.quizCorrect, shadowColor: colors.quizCorrect }]}>
        <AppIcon name="auto-awesome" size={20} color={colors.onPrimary} filled />
        <Text style={[styles.primaryLabel, { color: colors.onPrimary }]}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onHome}
        className="w-full items-center justify-center rounded-card py-4"
        style={{ backgroundColor: colors.surfaceLowest, borderWidth: 1, borderColor: colors.surfaceVariant }}>
        <Text style={[styles.secondaryLabel, { color: colors.onSurface }]}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
  },
  secondaryLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodySemibold,
  },
});
