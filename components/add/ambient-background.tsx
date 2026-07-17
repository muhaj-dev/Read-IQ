import { StyleSheet, View } from 'react-native';

import { GlowCircle } from '@/components/ui/glow-circle';
import { useTheme } from '@/hooks/use-theme';

/** Scan-result backdrop: two soft colour glows from opposite corners. */
export function AmbientBackground() {
  const colors = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.topRight}>
        <GlowCircle color={colors.secondaryContainer} size={500} opacity={0.25} />
      </View>
      <View style={styles.bottomLeft}>
        <GlowCircle color={colors.primaryContainer} size={400} opacity={0.18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRight: {
    position: 'absolute',
    top: -250,
    right: -250,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: -200,
    left: -200,
  },
});
