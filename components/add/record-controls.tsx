import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  paused: boolean;
  /** Stop and throw the recording away. */
  onDiscard: () => void;
  /** Pause ↔ resume. */
  onToggle: () => void;
  /** Stop and keep the recording. */
  onFinish: () => void;
};

/** Record controls cluster: stop · pause/resume · save (see the record mock). */
export function RecordControls({ paused, onDiscard, onToggle, onFinish }: Props) {
  const colors = useTheme();

  return (
    <View className="w-full flex-row items-center justify-between px-4">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Stop and discard"
        onPress={onDiscard}
        className="h-14 w-14 items-center justify-center rounded-pill"
        style={{ backgroundColor: colors.surfaceLow }}>
        <AppIcon name="stop" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Resume recording' : 'Pause recording'}
        activeOpacity={0.85}
        onPress={onToggle}
        className="h-20 w-20 items-center justify-center rounded-pill"
        style={[
          styles.main,
          {
            backgroundColor: paused ? colors.primary : colors.secondary,
            shadowColor: colors.secondaryContainer,
          },
          !paused && styles.mainGlow,
        ]}>
        <AppIcon name={paused ? 'play' : 'pause'} size={34} color={colors.onPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Save recording"
        onPress={onFinish}
        className="h-14 w-14 items-center justify-center rounded-pill"
        style={{ backgroundColor: colors.surfaceLow }}>
        <AppIcon name="check-circle" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  // 0 0 25px rgba(96,99,238,.4) from the mock while recording.
  mainGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
});
