import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlowCircle } from '@/components/ui/glow-circle';
import { useTheme } from '@/hooks/use-theme';

const BAR_COUNT = 15;
const randomHeights = () => Array.from({ length: BAR_COUNT }, () => 20 + Math.random() * 80);

type Props = {
  /** Bars dance while recording and freeze when paused. */
  active: boolean;
};

/** Animated mock waveform with soft glow (random heights until real metering). */
export function RecordWaveform({ active }: Props) {
  const colors = useTheme();
  const [heights, setHeights] = useState(randomHeights);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setHeights(randomHeights()), 150);
    return () => clearInterval(id);
  }, [active]);

  return (
    <View className="items-center justify-center">
      <View className="absolute">
        <GlowCircle color={colors.secondaryContainer} size={320} opacity={0.45} />
      </View>
      <View className="h-32 w-64 flex-row items-center justify-center gap-1.5">
        {heights.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { height: `${height}%`, backgroundColor: colors.secondaryContainer },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 3,
    borderRadius: 4,
  },
});
