import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function SkeletonBox({ style }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[{ backgroundColor: colors.skeleton ?? colors.border }, style, { opacity }]} />;
}

export function OrderCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.row}>
        <SkeletonBox style={{ width: 90, height: 24, borderRadius: 12 }} />
        <SkeletonBox style={{ width: 28, height: 28, borderRadius: 14 }} />
      </View>
      <SkeletonBox style={{ width: 140, height: 12, borderRadius: 6, marginTop: 10 }} />
      <View style={styles.chipsRow}>
        {[80, 95, 70].map((w, i) => (
          <SkeletonBox key={i} style={{ width: w, height: 28, borderRadius: 14 }} />
        ))}
      </View>
      <SkeletonBox style={{ width: '100%', height: 1, marginVertical: 14 }} />
      <View style={styles.row}>
        <SkeletonBox style={{ width: 80, height: 28, borderRadius: 8 }} />
        <SkeletonBox style={{ width: 110, height: 38, borderRadius: 12 }} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.listItem, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <SkeletonBox style={{ width: 38, height: 38, borderRadius: 12, marginRight: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox style={{ width: '60%', height: 14, borderRadius: 7 }} />
        <SkeletonBox style={{ width: '40%', height: 11, borderRadius: 5 }} />
      </View>
      <SkeletonBox style={{ width: 50, height: 18, borderRadius: 9 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 2 },
  listItem: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
});
