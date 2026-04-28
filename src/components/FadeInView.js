import { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, ReduceMotion, cancelAnimation,
} from 'react-native-reanimated';

export default function FadeInView({ delay = 0, duration = 250, style, children }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const run = () => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      });
    };
    if (delay > 0) {
      const t = setTimeout(run, delay);
      return () => { clearTimeout(t); cancelAnimation(opacity); };
    }
    run();
    return () => cancelAnimation(opacity);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
