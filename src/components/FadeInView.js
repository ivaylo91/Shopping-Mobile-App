import { useEffect, useLayoutEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, ReduceMotion, cancelAnimation,
} from 'react-native-reanimated';

// Strong ease-out — starts fast, feels responsive
const EASING = Easing.bezier(0.23, 1, 0.32, 1);

export default function FadeInView({ delay = 0, duration = 260, style, children }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  // useLayoutEffect fires before the first paint, eliminating the 1-frame grey flash
  // for delay=0 items. Delayed items still use useEffect + setTimeout.
  useLayoutEffect(() => {
    if (delay > 0) return;
    const cfg = { duration, easing: EASING, reduceMotion: ReduceMotion.System };
    opacity.value = withTiming(1, cfg);
    translateY.value = withTiming(0, cfg);
    return () => { cancelAnimation(opacity); cancelAnimation(translateY); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (delay === 0) return;
    const cfg = { duration, easing: EASING, reduceMotion: ReduceMotion.System };
    const t = setTimeout(() => {
      opacity.value = withTiming(1, cfg);
      translateY.value = withTiming(0, cfg);
    }, delay);
    return () => { clearTimeout(t); cancelAnimation(opacity); cancelAnimation(translateY); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
