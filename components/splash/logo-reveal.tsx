import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { images } from '@/constants/images';
import { Colors } from '@/constants/theme';
import { fonts } from '@/constants/typography';

// Splash flow is always light (see splash-background.tsx).
const light = Colors.light;

// Source-pixel geometry from the readIQ PNGs so the mark's IQ lands on the wordmark's IQ.
// The mark (readiq-iqmark) is the wordmark's own "✦ IQ" crop, so the IQ is pixel-identical:
// the mark shows IQ alone first, then the crossfade only reveals "read" beside it.
const WORD_SRC = { w: 983, h: 584, iqCx: 806, iqCy: 422, iqH: 266 };
const MARK_SRC = { w: 472, h: 548, iqCx: 316, iqCy: 404, iqH: 266 };

const WORD_W = 224; // rendered wordmark width (dp)
const ws = WORD_W / WORD_SRC.w;
const BOX_H = WORD_SRC.h * ws;

// Final mark size: its IQ letters render at the same height as the wordmark's.
const ms = (WORD_SRC.iqH * ws) / MARK_SRC.iqH;
const MARK_W = MARK_SRC.w * ms;
const MARK_H = MARK_SRC.h * ms;
// Final position: the mark's IQ centre sits on the wordmark's IQ centre.
const MARK_LEFT = WORD_SRC.iqCx * ws - MARK_SRC.iqCx * ms;
const MARK_TOP = WORD_SRC.iqCy * ws - MARK_SRC.iqCy * ms;

// Start centred at the native splash size (imageWidth 120) for a seamless handoff.
const START_SCALE = 120 / MARK_W;
const START_TX = WORD_W / 2 - (MARK_LEFT + MARK_W / 2);
const START_TY = BOX_H / 2 - (MARK_TOP + MARK_H / 2);

const HOLD_MS = 700; // mark alone, continuing the native splash
const MOVE_MS = 650; // slide right into the lockup position
const CROSSFADE_MS = 400;

type Props = {
  /** Called once the full lockup + tagline have settled. */
  onSettled: () => void;
};

/** Splash hero — the "✦ IQ" mark glides onto the wordmark's IQ, then the tagline rises. */
export function LogoReveal({ onSettled }: Props) {
  const progress = useSharedValue(0); // 0 = centred mark, 1 = in the lockup
  const markOpacity = useSharedValue(1);
  const wordOpacity = useSharedValue(0);
  const taglineIn = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      HOLD_MS,
      withTiming(1, { duration: MOVE_MS, easing: Easing.inOut(Easing.cubic) }),
    );
    wordOpacity.value = withDelay(HOLD_MS + MOVE_MS - 250, withTiming(1, { duration: CROSSFADE_MS }));
    markOpacity.value = withDelay(HOLD_MS + MOVE_MS - 100, withTiming(0, { duration: CROSSFADE_MS }));
    taglineIn.value = withDelay(
      HOLD_MS + MOVE_MS + 250,
      withTiming(1, { duration: 400 }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(onSettled);
      }),
    );
  }, [progress, markOpacity, wordOpacity, taglineIn, onSettled]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [START_TX, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [START_TY, 0]) },
      { scale: interpolate(progress.value, [0, 1], [START_SCALE, 1]) },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineIn.value,
    transform: [{ translateY: interpolate(taglineIn.value, [0, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.box}>
      <Animated.View style={[StyleSheet.absoluteFill, wordStyle]}>
        <Image
          source={images.readiqWordmark}
          style={{ width: WORD_W, height: BOX_H }}
          contentFit="contain"
          accessibilityLabel="readIQ"
        />
      </Animated.View>

      <Animated.View style={[styles.mark, markStyle]}>
        <Image
          source={images.readiqMark}
          style={{ width: MARK_W, height: MARK_H }}
          contentFit="contain"
          accessibilityLabel="readIQ"
        />
      </Animated.View>

      <Animated.View style={[styles.tagline, taglineStyle]}>
        <Text style={[styles.taglineText, { color: light.textSecondary }]}>
          Your AI study partner that only answers from your own notes.
        </Text>
      </Animated.View>
    </View>
  );
}

// Geometry computed from the constants above → StyleSheet, not NativeWind.
const styles = StyleSheet.create({
  box: { width: WORD_W, height: BOX_H },
  mark: { position: 'absolute', left: MARK_LEFT, top: MARK_TOP },
  tagline: {
    position: 'absolute',
    top: BOX_H + 24,
    left: (WORD_W - 300) / 2,
    width: 300,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
  },
});
