import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { RecorderStatus } from '@/hooks/use-lecture-recorder';

const STATUS_LABEL: Record<RecorderStatus, string> = {
  starting: 'Starting...',
  denied: '',
  recording: 'Recording...',
  paused: 'Paused',
  stopped: 'Stopped',
};

const format = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

type Props = {
  seconds: number;
  status: RecorderStatus;
};

/** Big HH:MM:SS readout with the pulsing red "Recording..." status below. */
export function RecordTimer({ seconds, status }: Props) {
  const colors = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value =
      status === 'recording' ? withRepeat(withTiming(0.3, { duration: 800 }), -1, true) : withTiming(1);
  }, [status, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View className="items-center gap-2">
      <Text style={[styles.timer, { color: colors.primary }]}>{format(seconds)}</Text>
      <View className="flex-row items-center gap-2">
        <Animated.View
          style={[
            styles.dot,
            dotStyle,
            { backgroundColor: status === 'recording' ? colors.error : colors.outline },
          ]}
        />
        <Text style={[styles.status, { color: colors.onSurfaceVariant }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: fonts.headingExtrabold,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
