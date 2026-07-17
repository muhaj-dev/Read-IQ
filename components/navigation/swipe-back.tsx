import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  /** Where a right-swipe returns to. Defaults to router.back() → /home. */
  onBack?: () => void;
};

// A drag must START within this many px of the left edge to count as "back".
const EDGE_WIDTH = 40;
// Horizontal travel (px) before the pan claims the touch from the ScrollView.
const ACTIVATE_X = 16;
// Vertical travel (px) that hands the touch back to the vertical ScrollView.
const FAIL_Y = 14;

/** Edge-swipe-to-go-back for full-screen tabs that lack the native gesture. */
export function SwipeBackView({ children, onBack }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const startX = useSharedValue(0);
  const translateX = useSharedValue(0);

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  const pan = Gesture.Pan()
    .activeOffsetX(ACTIVATE_X)
    .failOffsetY([-FAIL_Y, FAIL_Y])
    .onBegin((e) => {
      startX.value = e.x;
    })
    .onUpdate((e) => {
      if (startX.value > EDGE_WIDTH) return; // not an edge swipe — ignore
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (startX.value > EDGE_WIDTH) return;
      const release = e.translationX > width * 0.35 || e.velocityX > 800;
      if (release) {
        translateX.value = withTiming(width, { duration: 180 }, (done) => {
          if (done) {
            runOnJS(goBack)();
            translateX.value = 0; // reset off-screen; the tab stays mounted
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
