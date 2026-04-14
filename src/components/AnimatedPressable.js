/**
 * AnimatedPressable — shared press-scale component using Reanimated 4.
 *
 * Replaces the duplicated Animated.createAnimatedComponent(TouchableOpacity)
 * pattern that existed in HomeScreen and ShoppingListScreen.
 *
 * Reanimated 4 benefits over the old Animated API:
 *  - Runs entirely on the UI thread (no JS bridge round-trips)
 *  - Cleaner `useSharedValue` + `useAnimatedStyle` API
 *  - Better performance on low-end devices
 */
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const SPRING_IN  = { mass: 0.3, damping: 10, stiffness: 200 };
const SPRING_OUT = { mass: 0.3, damping: 10, stiffness: 200 };

export default function AnimatedPressable({ onPress, style, children, disabled }) {
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
    >
      {children}
    </AnimatedPress>
  );
}
