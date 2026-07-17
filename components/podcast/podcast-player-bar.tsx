import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  playing: boolean;
  atEnd: boolean;
  /** 0–1 across the episode. */
  progress: number;
  activeIndex: number;
  count: number;
  /** Name of the host on the current turn (shown under the counter). */
  speakerName: string;
  onToggle: () => void;
  onRestart: () => void;
};

/** Pinned player controls: progress track, restart, play/pause, turn counter. */
export function PodcastPlayerBar({
  playing,
  atEnd,
  progress,
  activeIndex,
  count,
  speakerName,
  onToggle,
  onRestart,
}: Props) {
  const colors = useTheme();
  const icon = playing ? 'pause' : atEnd ? 'replay' : 'play';

  return (
    <View
      className="gap-3 px-5 pb-4 pt-3"
      style={{ backgroundColor: colors.surfaceLowest, borderTopColor: colors.outlineVariant, borderTopWidth: 1 }}>
      {/* Progress track */}
      <View className="h-1 overflow-hidden rounded-pill" style={{ backgroundColor: colors.surfaceLow }}>
        <View
          className="h-full rounded-pill"
          style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: colors.secondary }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Restart episode"
          activeOpacity={0.7}
          onPress={onRestart}
          className="h-11 w-11 items-center justify-center rounded-pill"
          style={{ backgroundColor: withAlpha(colors.secondary, 0.1) }}>
          <AppIcon name="replay" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          activeOpacity={0.85}
          onPress={onToggle}
          className="h-16 w-16 items-center justify-center rounded-pill"
          style={[styles.play, { backgroundColor: colors.secondary, shadowColor: colors.shadow }]}>
          <AppIcon name={icon} size={30} color={colors.onPrimary} />
        </TouchableOpacity>

        <View className="w-12 items-center">
          <Text style={[styles.count, { color: colors.onSurface }]}>
            {Math.min(activeIndex + 1, count)}/{count}
          </Text>
          <Text style={[styles.caption, { color: colors.outline }]} numberOfLines={1}>
            {speakerName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  play: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  count: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.headingSemibold,
  },
  caption: {
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.3,
    fontFamily: fonts.bodyMedium,
  },
});
