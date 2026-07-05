import * as Speech from 'expo-speech';
import { useCallback, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { HOST_PITCH, PREVIEW_LINE, RATE_PRESETS } from '@/lib/podcast-voices';
import { usePodcastVoiceStore } from '@/store/use-podcast-voice-store';
import type { PodcastSpeaker } from '@/types/podcast';

import { VoiceHostSection } from './voice-host-section';

type Props = { visible: boolean; onClose: () => void };

/** The "Podcast voices" bottom sheet: pick a device voice for each host (tapping a
 *  voice previews it aloud) and set the speaking speed. Choices persist via the
 *  podcast voice store; the player picks them up on the next play. */
export function VoicePickerSheet({ visible, onClose }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const voices = usePodcastVoiceStore((s) => s.voices);
  const prefs = usePodcastVoiceStore((s) => s.prefs);
  const setVoice = usePodcastVoiceStore((s) => s.setVoice);
  const setRate = usePodcastVoiceStore((s) => s.setRate);

  // Stop any preview when the sheet hides or the screen unmounts.
  useEffect(() => {
    if (!visible) Speech.stop();
    return () => {
      Speech.stop();
    };
  }, [visible]);

  const choose = useCallback(
    (speaker: PodcastSpeaker, id: string) => {
      setVoice(speaker, id);
      Speech.stop();
      Speech.speak(PREVIEW_LINE[speaker], {
        voice: id,
        pitch: HOST_PITCH[speaker],
        rate: prefs.rate,
      });
    },
    [setVoice, prefs.rate],
  );

  // Replay a host's current voice when its chat bubble is tapped (no-op if the
  // host is on the system default, which has no id to preview).
  const preview = useCallback(
    (speaker: PodcastSpeaker) => {
      const id = prefs[speaker];
      if (!id) return;
      Speech.stop();
      Speech.speak(PREVIEW_LINE[speaker], { voice: id, pitch: HOST_PITCH[speaker], rate: prefs.rate });
    },
    [prefs],
  );

  const close = () => {
    Speech.stop();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          onPress={close}
          style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.4) }]}
        />

        <View style={[styles.sheet, { backgroundColor: colors.surfaceLowest }]}>
          <View
            className="flex-row items-center justify-between px-5 pb-3 pt-4"
            style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outlineVariant, 0.3) }}>
            <View className="flex-1 pr-3">
              <Text style={[styles.title, { color: colors.onSurface }]}>Podcast voices</Text>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                Tap a voice to hear it and set it for that host.
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={close} hitSlop={12} className="px-1">
              <Text style={[styles.done, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {voices.length === 0 ? (
            <View className="px-5 py-10">
              <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
                Your device didn’t offer any selectable voices, so the hosts use the built-in
                default. You can still change the speaking speed below.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollBody}>
              <VoiceHostSection
                speaker="A"
                role="asks the questions"
                voices={voices}
                selectedId={prefs.A}
                onSelect={(id) => choose('A', id)}
                onPreview={() => preview('A')}
              />
              <VoiceHostSection
                speaker="B"
                role="explains"
                voices={voices}
                selectedId={prefs.B}
                onSelect={(id) => choose('B', id)}
                onPreview={() => preview('B')}
              />
              <Text style={[styles.footnote, { color: colors.outline }]}>
                Three female and two male voices, all distinct. Nigerian voices show up here when your
                device has them installed — add more in your phone’s text-to-speech settings.
              </Text>
            </ScrollView>
          )}

          <View
            className="gap-2 px-5 pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: withAlpha(colors.outlineVariant, 0.3),
              paddingBottom: 16 + insets.bottom,
            }}>
            <Text style={[styles.rateLabel, { color: colors.onSurfaceVariant }]}>SPEAKING SPEED</Text>
            <View className="flex-row gap-2">
              {RATE_PRESETS.map((preset) => {
                const active = Math.abs(prefs.rate - preset.value) < 0.001;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    activeOpacity={0.8}
                    onPress={() => setRate(preset.value)}
                    className="flex-1 items-center rounded-inner py-2.5"
                    style={{ backgroundColor: active ? colors.secondary : colors.surfaceLow }}>
                    <Text style={[styles.rate, { color: active ? colors.onPrimary : colors.onSurface }]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 20,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.headingBold,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.bodyRegular,
  },
  done: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  empty: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.bodyRegular,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.bodyRegular,
  },
  rateLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontFamily: fonts.bodyBold,
  },
  rate: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
});
