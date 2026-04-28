import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, ReduceMotion, runOnJS,
} from 'react-native-reanimated';
import Text from '../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: { backgroundColor: '#2ecc71' },
  error:   { backgroundColor: '#e74c3c' },
  warning: { backgroundColor: '#f39c12' },
  info:    { backgroundColor: '#2B7A5C' },
};

const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const SPRING = { mass: 0.3, stiffness: 200, damping: 18, reduceMotion: ReduceMotion.System };

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const timerRef = useRef(null);
  const insets = useSafeAreaInsets();

  const clearToast = useCallback(() => setToast(null), []);

  const show = useCallback(
    (message, type = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });

      opacity.value = 0;
      translateY.value = 16;

      opacity.value = withSpring(1, SPRING);
      translateY.value = withSpring(0, SPRING);

      timerRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 280, reduceMotion: ReduceMotion.System });
        translateY.value = withTiming(
          16,
          { duration: 280, reduceMotion: ReduceMotion.System },
          (finished) => { if (finished) runOnJS(clearToast)(); },
        );
      }, 2600);
    },
    [opacity, translateY, clearToast],
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            TYPE_STYLES[toast.type],
            { bottom: insets.bottom + 72 },
            animStyle,
          ]}
        >
          <Text style={styles.icon}>{TYPE_ICONS[toast.type]}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: { color: '#fff', fontSize: 15, fontWeight: '700', width: 18, textAlign: 'center' },
  message: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
});
