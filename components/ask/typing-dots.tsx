import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

/** One pulsing dot; `delay` staggers the three so they ripple. */
function Dot({ delay }: { delay: number }) {
  const colors = useTheme();
  const progress = useSharedValue(0.35);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: colors.outline }, style]} />;
}

/** The "noteIQ is reading your notes…" indicator shown before the first token. */
export function TypingDots() {
  return (
    <View className="flex-row items-center" style={styles.row}>
      <Dot delay={0} />
      <Dot delay={160} />
      <Dot delay={320} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
