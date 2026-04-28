import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, ReduceMotion, cancelAnimation,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState, memo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOrders } from '../hooks/useOrders';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { getCategoryIcon, GOAL_META } from '../utils/ui';
import { OrderCardSkeleton } from '../components/Skeleton';
import AnimatedPressable from '../components/AnimatedPressable';

function FloatingIcon({ name, size, color }) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 1500, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(translateY);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function getStatusConfig(colors) {
  return {
    pending:    { label: 'Изчаква',      color: colors.orange,  icon: 'time-outline' },
    processing: { label: 'Обработва се', color: colors.blue,    icon: 'sync-outline' },
    shipped:    { label: 'Изпратена',    color: colors.purple,  icon: 'cube-outline' },
    delivered:  { label: 'Доставена',   color: colors.green,   icon: 'checkmark-circle-outline' },
    cancelled:  { label: 'Отказана',    color: colors.red,     icon: 'close-circle-outline' },
  };
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—';
  return timestamp.toDate().toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const OrderCard = memo(function OrderCard({ item, s, colors }) {
  const statusConfig = getStatusConfig(colors);
  const status = statusConfig[item.status] || statusConfig.pending;
  const meta = GOAL_META[item.goal] || GOAL_META.cheapest;

  return (
    <View style={s.card}>
      {/* Header row */}
      <View style={s.cardHeader}>
        <View style={s.orderIdRow}>
          <Text style={s.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: status.color }]}>
          <Ionicons name={status.icon} size={11} color="#fff" />
          <Text style={s.statusText}>{status.label}</Text>
        </View>
      </View>

      {/* Goal + Store */}
      <View style={s.metaRow}>
        <View style={[s.goalPill, { backgroundColor: meta.color + '22' }]}>
          <Text style={[s.goalPillText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
        </View>
        {item.store && item.store !== 'any' && (
          <View style={s.storePill}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
            <Text style={s.storePillText}>{item.store}</Text>
          </View>
        )}
      </View>

      {/* Product list — max 4 shown */}
      <View style={s.productList}>
        {(item.items || []).slice(0, 4).map((p, idx) => (
          <View key={p.id || idx} style={s.productRow}>
            <Text style={s.productIcon}>{getCategoryIcon(p.category)}</Text>
            <Text style={s.productName} numberOfLines={1}>{p.name}</Text>
            <Text style={s.productQty}>×{p.quantity}</Text>
          </View>
        ))}
        {(item.items || []).length > 4 && (
          <Text style={s.moreItems}>+{item.items.length - 4} още продукта</Text>
        )}
      </View>

      {/* Total */}
      <View style={s.cardFooter}>
        <Text style={s.totalLabel}>Обща сума</Text>
        <Text style={s.totalValue}>{item.total?.toFixed(2)} €</Text>
      </View>
    </View>
  );
});

export default function OrdersScreen({ navigation }) {
  const { orders, loading, error } = useOrders();
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const [refreshing, setRefreshing] = useState(false);

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const handleRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = useCallback(
    ({ item }) => <OrderCard item={item} s={s} colors={colors} />,
    [s, colors],
  );

  const renderSkeletons = () => (
    <View style={{ padding: 16 }}>
      {[0, 1, 2].map(i => <OrderCardSkeleton key={i} />)}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Поръчки</Text>
            <Text style={s.headerSub}>Зарежда се…</Text>
          </View>
          {renderSkeletons()}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <View style={s.centered}>
            <Ionicons name="cloud-offline-outline" size={56} color={colors.border} />
            <Text style={s.errorText}>Грешка при зареждане</Text>
            <Text style={s.errorSub}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.inner}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Поръчки</Text>
          </View>
          <View style={s.emptyState}>
            <FloatingIcon name="bag-outline" size={72} color={colors.border} />
            <Text style={s.emptyTitle}>Все още нямате поръчки</Text>
            <Text style={s.emptyDesc}>
              Направете своята първа поръчка от генерирания списък.
            </Text>
            <AnimatedPressable
              style={s.emptyBtn}
              onPress={() => navigation.navigate('Home')}
              accessibilityLabel="Към начало"
            >
              <Text style={s.emptyBtnText}>Към начало</Text>
            </AnimatedPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Поръчки</Text>
          <Text style={s.headerSub}>{orders.length} поръчки</Text>
        </View>
        <FlashList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={200}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    inner: { flex: 1, maxWidth: isTablet ? 720 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },
    errorText: { fontSize: 16, color: c.red, fontWeight: '700', marginTop: 12 },
    errorSub: { fontSize: 13, color: c.textTertiary, textAlign: 'center' },

    header: {
      backgroundColor: c.card,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 2 },
    headerSub: { fontSize: 13, color: c.textTertiary },

    list: { padding: 16, paddingBottom: 32 },

    card: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 10,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    orderIdRow: { gap: 3 },
    orderId: { fontSize: 14, fontWeight: '700', color: c.text },
    dateText: { fontSize: 11, color: c.textQuaternary, fontWeight: '500' },
    statusBadge: {
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    goalPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    goalPillText: { fontSize: 12, fontWeight: '700' },
    storePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.cardAlt,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    storePillText: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },

    productList: { gap: 5, marginBottom: 12 },
    productRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    productIcon: { fontSize: 14, width: 20, textAlign: 'center' },
    productName: { flex: 1, fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    productQty: { fontSize: 13, color: c.textTertiary, fontWeight: '600' },
    moreItems: { fontSize: 12, color: c.textTertiary, fontWeight: '600', marginTop: 2 },

    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: c.borderLight,
      paddingTop: 12,
    },
    totalLabel: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '700', color: c.primary },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8, marginTop: 16 },
    emptyDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    emptyBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingHorizontal: 28,
      paddingVertical: 14,
      shadowColor: c.primary,
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
