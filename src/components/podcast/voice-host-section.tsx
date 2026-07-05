import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { PREVIEW_LINE, type DeviceVoice } from '@/lib/podcast-voices';
import { HOSTS, type PodcastSpeaker } from '@/types/podcast';

import { hostAccent } from './host-accent';
import { VoiceOptionRow } from './voice-option-row';

type Props = {
  speaker: PodcastSpeaker;
  /** Short role line under the host name ("asks the questions" / "explains"). */
  role: string;
  voices: DeviceVoice[];
  selectedId: string | null;
  onSelect: (identifier: string) => void;
  /** Replays the host's current voice — fired when the chat bubble is tapped. */
  onPreview: () => void;
};

/** One host in the voice picker, laid out like an Ask-chat turn: Maya (A) sits on
 *  the RIGHT in a filled indigo bubble (like the student's message), Leo (B) on the
 *  LEFT in a white bubble (like noteIQ's reply). The bubble "speaks" the host's
 *  sample line and names the chosen voice; the option rows below switch it. */
export function VoiceHostSection({ speaker, role, voices, selectedId, onSelect, onPreview }: Props) {
  const colors = useTheme();
  const accent = hostAccent(colors, speaker);
  const name = HOSTS[speaker];
  const right = speaker === 'A';
  const selected = voices.find((v) => v.identifier === selectedId);
  const voiceLabel = selected ? selected.name : 'System default';

  return (
    <View className="gap-3">
      <View className={right ? 'items-end' : 'items-start'}>
        {/* Sender chip: avatar initial + name + role, mirrored to the bubble side. */}
        <View className={`mb-1 flex-row items-center gap-1.5 px-1 ${right ? 'flex-row-reverse' : ''}`}>
          <View
            className="h-6 w-6 items-center justify-center rounded-pill"
            style={{ backgroundColor: accent }}>
            <Text style={[styles.initial, { color: colors.onPrimary }]}>{name.charAt(0)}</Text>
          </View>
          <Text style={[styles.name, { color: accent }]}>{name}</Text>
          <Text style={[styles.role, { color: colors.onSurfaceVariant }]}>· {role}</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Hear ${name}'s voice, ${voiceLabel}`}
          activeOpacity={0.85}
          onPress={onPreview}
          className="max-w-[88%] gap-2 rounded-card px-4 py-3.5"
          style={[
            right ? styles.tailRight : styles.tailLeft,
            {
              backgroundColor: right ? colors.secondaryContainer : colors.surfaceLowest,
              borderColor: right ? 'transparent' : colors.outlineVariant,
              shadowColor: colors.shadow,
            },
          ]}>
          <Text style={[styles.line, { color: right ? colors.onPrimary : colors.onSurface }]}>
            {PREVIEW_LINE[speaker]}
          </Text>
          <View className={`flex-row items-center gap-1.5 ${right ? 'justify-end' : ''}`}>
            <AppIcon name="play" size={12} color={right ? withAlpha(colors.onPrimary, 0.85) : accent} />
            <Text
              numberOfLines={1}
              style={[
                styles.voice,
                { color: right ? withAlpha(colors.onPrimary, 0.85) : colors.onSurfaceVariant },
              ]}>
              {voiceLabel}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="gap-2">
        {voices.map((voice) => (
          <VoiceOptionRow
            key={voice.identifier}
            voice={voice}
            accent={accent}
            selected={voice.identifier === selectedId}
            onPress={() => onSelect(voice.identifier)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tailLeft: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tailRight: {
    borderWidth: 1,
    borderTopRightRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  initial: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fonts.headingBold,
  },
  name: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.headingSemibold,
  },
  role: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  line: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.bodyRegular,
  },
  voice: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
