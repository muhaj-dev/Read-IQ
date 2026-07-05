import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { PodcastSpeaker } from '@/types/podcast';

import { hostAccent } from './host-accent';

type Props = {
  speaker: PodcastSpeaker;
  name: string;
  text: string;
  /** The turn currently being spoken/read — pops out so the read-along is obvious. */
  active: boolean;
  onPress: () => void;
};

/** One turn of the two-host conversation, laid out like the Ask chat: the FIRST
 *  voice — Maya (A) — sits on the RIGHT in a filled indigo bubble (like the
 *  student's message); the second — Leo (B) — on the LEFT in a white bubble (like
 *  noteIQ's reply). The turn the voice is CURRENTLY reading pops out — lifted with a
 *  shadow, an accent ring, a gentle scale, and a 🎧 cue — so the student always sees
 *  which line is being spoken; the rest stay calm and flat. */
export function HostTurn({ speaker, name, text, active, onPress }: Props) {
  const colors = useTheme();
  const accent = hostAccent(colors, speaker);
  const right = speaker === 'A';

  const bubbleColor = right ? colors.secondaryContainer : colors.surfaceLowest;
  const textColor = right ? colors.onPrimary : active ? colors.onSurface : colors.onSurfaceVariant;
  // No borders anywhere — turns read apart through fill + size + shadow alone. The turn
  // being read pops out purely by growing; every bubble stays clean and outline-free.
  // The white (left) bubble grows more gently than the indigo (right) one so its lighter
  // fill doesn't feel oversized when active.
  const activeScale = right ? 1.14 : 1.09;

  return (
    <View className={right ? 'items-end' : 'items-start'}>
      {/* Sender chip: avatar initial + name, mirrored to the bubble's side, with a
          headphones cue on the turn being read aloud. */}
      <View className={`mb-1 flex-row items-center gap-1.5 px-1 ${right ? 'flex-row-reverse' : ''}`}>
        <View
          className="h-5 w-5 items-center justify-center rounded-pill"
          style={{ backgroundColor: accent }}>
          <Text style={[styles.initial, { color: colors.onPrimary }]}>{name.charAt(0)}</Text>
        </View>
        <Text style={[styles.name, { color: accent }]}>{name}</Text>
        {active ? <AppIcon name="headphones" size={13} color={accent} /> : null}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${name}${active ? ', now reading' : ''}: ${text}`}
        accessibilityState={{ selected: active }}
        activeOpacity={0.8}
        onPress={onPress}
        className={`max-w-[86%] rounded-card ${active ? 'px-5 py-4' : 'px-4 py-3'}`}
        style={[
          right ? styles.tailRight : styles.tailLeft,
          active ? styles.lift : styles.flat,
          {
            backgroundColor: bubbleColor,
            shadowColor: colors.shadow,
            // Always an array (never undefined) — a null transform crashes
            // processTransform on the New Architecture. The active turn grows large so
            // it clearly lifts off the thread; idle turns sit at their natural size.
            // Anchored to the sender's edge so the bigger bubble grows inward instead
            // of clipping off its own side of the screen.
            transform: [{ scale: active ? activeScale : 1 }],
            transformOrigin: right ? 'right center' : 'left center',
          },
        ]}>
        <Text style={[active ? styles.textActive : styles.text, { color: textColor }]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // A shrink-to-fit chat bubble with a small "tail" on the sender's side. No
  // border — the fill, size, and shadow carry the whole look.
  tailLeft: {
    borderTopLeftRadius: 4,
  },
  tailRight: {
    borderTopRightRadius: 4,
  },
  flat: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  lift: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10,
  },
  initial: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.headingBold,
  },
  name: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    fontFamily: fonts.bodyBold,
  },
  text: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodyRegular,
  },
  // The turn being read aloud gets a few extra px so it's easy to follow along;
  // combined with the 1.14 bubble scale it reads clearly larger than the thread.
  textActive: {
    fontSize: 18,
    lineHeight: 27,
    fontFamily: fonts.bodyRegular,
  },
});
