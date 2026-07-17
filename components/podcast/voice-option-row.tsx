import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { DeviceVoice } from '@/lib/podcast-voices';

type Props = {
  voice: DeviceVoice;
  selected: boolean;
  /** The host's accent (Maya indigo / Leo violet) — tints the selected row. */
  accent: string;
  /** Tapping the row both selects the voice AND plays a short preview of it. */
  onPress: () => void;
};

/** One voice in the picker: play/check dot, name, tags, HD badge; tap to hear and choose. */
export function VoiceOptionRow({ voice, selected, accent, onPress }: Props) {
  const colors = useTheme();

  // Skip the gender tag when the fallback name already spells it ("Female voice 2").
  const genderLabel = voice.gender === 'female' ? 'Female' : voice.gender === 'male' ? 'Male' : '';
  const showGender = !!genderLabel && !new RegExp(voice.gender, 'i').test(voice.name);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${voice.name}${selected ? ', selected' : ''}. Tap to hear and choose.`}
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-inner px-3 py-3"
      style={{
        backgroundColor: selected ? withAlpha(accent, 0.12) : colors.surfaceLow,
        borderWidth: 1,
        borderColor: selected ? withAlpha(accent, 0.5) : 'transparent',
      }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-pill"
        style={{ backgroundColor: selected ? accent : withAlpha(colors.outline, 0.15) }}>
        <AppIcon
          name={selected ? 'check' : 'play'}
          size={16}
          color={selected ? colors.onPrimary : colors.onSurfaceVariant}
        />
      </View>

      <Text className="flex-1" numberOfLines={1} style={[styles.name, { color: colors.onSurface }]}>
        {voice.name}
      </Text>

      {voice.nigerian ? (
        <View
          className="rounded-pill px-2 py-0.5"
          style={{ backgroundColor: withAlpha(colors.noteGreen, 0.14) }}>
          <Text style={[styles.badge, { color: colors.noteGreen }]}>🇳🇬 Nigerian</Text>
        </View>
      ) : showGender ? (
        <Text style={[styles.gender, { color: colors.onSurfaceVariant }]}>{genderLabel}</Text>
      ) : null}

      {voice.enhanced ? (
        <View
          className="rounded-pill px-2 py-0.5"
          style={{ backgroundColor: withAlpha(colors.secondary, 0.12) }}>
          <Text style={[styles.badge, { color: colors.secondary }]}>HD</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
  gender: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  badge: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontFamily: fonts.bodyBold,
  },
});
