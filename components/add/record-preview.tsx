import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { GlowCircle } from '@/components/ui/glow-circle';
import { fonts } from '@/constants/typography';
import { useAudioPlayback } from '@/hooks/use-audio-playback';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// Fixed waveform — deterministic so the recorded clip doesn't flicker on re-render.
const BARS = [
  30, 55, 40, 70, 50, 85, 60, 45, 75, 35, 65, 90, 55, 40, 80, 50, 60, 95, 45,
  70, 35, 60, 85, 50, 40, 75, 55, 65, 45, 80,
];

const format = (seconds: number) =>
  [Math.floor(seconds / 60), Math.floor(seconds % 60)]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

type Props = {
  /** Length of the finished recording, in seconds. */
  seconds: number;
  /** Recorded file uri — enables tap-to-play. */
  uri?: string;
  /** Whether a transcript was produced (drives the corner badge). */
  transcribed?: boolean;
};

/** Recorded-clip preview: play button + progress waveform + duration + status badge. */
export function RecordPreview({ seconds, uri, transcribed = false }: Props) {
  const colors = useTheme();
  const { available, playing, position, progress, toggle } = useAudioPlayback(uri);

  // Full-colour at rest; split into played / unplayed once playback has started.
  const fill = playing || position > 0 ? progress : 1;
  const played = fill * BARS.length;

  return (
    <View
      className="w-full items-center justify-center overflow-hidden rounded-inner px-5 py-10"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: colors.outlineVariant,
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="absolute">
        <GlowCircle color={colors.secondaryContainer} size={260} opacity={0.35} />
      </View>

      <View className="h-24 flex-row items-center justify-center gap-1">
        {BARS.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${height}%`,
                backgroundColor:
                  index < played ? colors.secondary : withAlpha(colors.secondaryContainer, 0.45),
              },
            ]}
          />
        ))}
      </View>

      <View className="mt-6 flex-row items-center gap-4">
        {/* Tap to play / pause the recording. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause recording' : 'Play recording'}
          onPress={toggle}
          disabled={!available}
          activeOpacity={0.85}
          className="h-14 w-14 items-center justify-center rounded-pill"
          style={[
            styles.play,
            { backgroundColor: available ? colors.primary : colors.outlineVariant, shadowColor: colors.shadow },
          ]}>
          <AppIcon name={playing ? 'pause' : 'play'} size={26} color={colors.onPrimary} filled />
        </TouchableOpacity>

        <Text style={[styles.time, { color: colors.onSurface }]}>
          {available ? `${format(position)} / ${format(seconds)}` : format(seconds)}
        </Text>
      </View>

      <View
        className="absolute right-4 top-4 flex-row items-center gap-2 rounded-pill px-3 py-1.5"
        style={[
          styles.badge,
          { backgroundColor: transcribed ? colors.primary : colors.surfaceContainer, shadowColor: colors.shadow },
        ]}>
        <AppIcon
          name={transcribed ? 'check-circle' : 'mic'}
          size={16}
          color={transcribed ? colors.onPrimary : colors.secondary}
          filled={transcribed}
        />
        <Text
          style={[styles.badgeLabel, { color: transcribed ? colors.onPrimary : colors.onSurfaceVariant }]}>
          {transcribed ? 'Transcribed' : 'Recorded'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  bar: {
    width: 3,
    borderRadius: 4,
  },
  play: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  time: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingSemibold,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
