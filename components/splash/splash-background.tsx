import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';

// Splash flow is always light — reads light tokens directly, not useTheme().
const light = Colors.light;

/** Full-screen vertical gradient backdrop for the splash (white → soft lavender). */
export function SplashBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={light.splashTop} />
          <Stop offset="0.55" stopColor={light.splashMid} />
          <Stop offset="1" stopColor={light.splashBottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashBg)" />
    </Svg>
  );
}
