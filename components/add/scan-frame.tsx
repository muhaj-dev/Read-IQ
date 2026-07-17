import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CameraChrome } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/** Viewfinder overlay: dimmed frame, corner brackets, and the sweeping scan line. */
export function ScanFrame() {
  const colors = useTheme();
  const [height, setHeight] = useState(0);
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    sweep.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, [sweep, pulse]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * height }],
    opacity: interpolate(sweep.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));
  const focusStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      {/* Dimmed border framing the page being scanned. */}
      <View style={[StyleSheet.absoluteFill, styles.frame]} />

      {/* Corner brackets. */}
      <View style={[styles.bracket, styles.topLeft]} />
      <View style={[styles.bracket, styles.topRight]} />
      <View style={[styles.bracket, styles.bottomLeft]} />
      <View style={[styles.bracket, styles.bottomRight]} />

      {/* Sweeping scan line. */}
      <Animated.View
        style={[
          styles.line,
          lineStyle,
          { backgroundColor: colors.secondaryContainer, shadowColor: colors.secondaryContainer },
        ]}
      />

      {/* Focus indicator micro-interaction. */}
      <Animated.View
        style={[styles.focus, focusStyle, { borderColor: withAlpha(colors.secondary, 0.4) }]}
      />
    </View>
  );
}

const BRACKET = {
  position: 'absolute' as const,
  width: 48,
  height: 48,
  borderColor: CameraChrome.bracket,
};

const styles = StyleSheet.create({
  frame: {
    borderWidth: 40,
    borderColor: CameraChrome.frame,
  },
  bracket: BRACKET,
  topLeft: { top: 64, left: 64, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 64, right: 64, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: {
    bottom: 64,
    left: 64,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 64,
    right: 64,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 4,
  },
  focus: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    width: 80,
    height: 80,
    borderWidth: 2,
    borderRadius: 8,
  },
});
