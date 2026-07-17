import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/** Full-screen vertical indigo gradient behind the profile panel. */
export function ProfileBackground() {
  const colors = useTheme();

  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="profileBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.profileTop} />
          <Stop offset="1" stopColor={colors.profileBottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#profileBg)" />
    </Svg>
  );
}
