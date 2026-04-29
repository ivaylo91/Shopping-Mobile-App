import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const SPRING_IN  = { mass: 0.3, damping: 15, stiffness: 200, reduceMotion: ReduceMotion.System };
const SPRING_OUT = { mass: 0.3, damping: 15, stiffness: 200, reduceMotion: ReduceMotion.System };

export default function AnimatedPressable({
  onPress,
  style,
  children,
  disabled,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  accessibilityHint,
  ...rest
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPress
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96, SPRING_IN); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_OUT); }}
      disabled={disabled}
      style={[style, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      {children}
    </AnimatedPress>
  );
}
