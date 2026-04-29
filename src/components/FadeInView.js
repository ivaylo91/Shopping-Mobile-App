import { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, ReduceMotion, cancelAnimation,
} from 'react-native-reanimated';

// Strong ease-out — starts fast, feels responsive
const EASING = Easing.bezier(0.23, 1, 0.32, 1);

export default function FadeInView({ delay = 0, duration = 260, style, children }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    const cfg = { duration, easing: EASING, reduceMotion: ReduceMotion.System };
    const run = () => {
      opacity.value = withTiming(1, cfg);
      translateY.value = withTiming(0, cfg);
    };
    if (delay > 0) {
      const t = setTimeout(run, delay);
      return () => { clearTimeout(t); cancelAnimation(opacity); cancelAnimation(translateY); };
    }
    run();
    return () => { cancelAnimation(opacity); cancelAnimation(translateY); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
