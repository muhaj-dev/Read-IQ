import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
};

/** The gradient CTA pinned under Note Details ("Open Note"). */
export function OpenNoteButton({ label, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      className="h-14 w-full items-center justify-center overflow-hidden rounded-card"
      style={[styles.button, { shadowColor: colors.shadow }]}>
      {/* 135° indigo gradient from the mock (secondary → primaryContainer). */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="openNote" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.secondary} />
            <Stop offset="1" stopColor={colors.primaryContainer} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#openNote)" />
      </Svg>
      <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingSemibold,
  },
});
