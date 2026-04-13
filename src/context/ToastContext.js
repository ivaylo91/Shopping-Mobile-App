import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: { backgroundColor: '#2ecc71' },
  error:   { backgroundColor: '#e74c3c' },
  warning: { backgroundColor: '#f39c12' },
  info:    { backgroundColor: '#6C63FF' },
};

const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timerRef = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (message, type = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });

      opacity.setValue(0);
      translateY.setValue(16);

      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 16, duration: 280, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2600);
    },
    [opacity, translateY]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            TYPE_STYLES[toast.type],
            { bottom: insets.bottom + 72, opacity, transform: [{ translateY }] },
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
  icon: { color: '#fff', fontSize: 15, fontWeight: '800', width: 18, textAlign: 'center' },
  message: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
});
