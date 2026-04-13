import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOrders } from '../hooks/useOrders';
import { getCategoryIcon, GOAL_META } from '../utils/ui';
import { OrderCardSkeleton } from '../components/Skeleton';

const STATUS_CONFIG = {
  pending:    { label: 'Изчаква',      color: '#f39c12', icon: 'time-outline' },
  processing: { label: 'Обработва се', color: '#3498db', icon: 'sync-outline' },
  shipped:    { label: 'Изпратена',    color: '#9b59b6', icon: 'cube-outline' },
  delivered:  { label: 'Доставена',   color: '#2ecc71', icon: 'checkmark-circle-outline' },
  cancelled:  { label: 'Отказана',    color: '#e74c3c', icon: 'close-circle-outline' },
};

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—';
  return timestamp.toDate().toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const OrderCard = memo(function OrderCard({ item }) {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const meta = GOAL_META[item.goal] || GOAL_META.cheapest;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Ionicons name={status.icon} size={11} color="#fff" />
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      {/* Goal + Store */}
      <View style={styles.metaRow}>
        <View style={[styles.goalPill, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.goalPillText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
        </View>
        {item.store && item.store !== 'any' && (
          <View style={styles.storePill}>
            <Ionicons name="location-outline" size={11} color="#aaa" />
            <Text style={styles.storePillText}>{item.store}</Text>
          </View>
        )}
      </View>

      {/* Product list — max 4 shown */}
      <View style={styles.productList}>
        {(item.items || []).slice(0, 4).map((p, idx) => (
          <View key={p.id || idx} style={styles.productRow}>
            <Text style={styles.productIcon}>{getCategoryIcon(p.category)}</Text>
            <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.productQty}>×{p.quantity}</Text>
          </View>
        ))}
        {(item.items || []).length > 4 && (
          <Text style={styles.moreItems}>+{item.items.length - 4} още продукта</Text>
        )}
      </View>

      {/* Total */}
      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Обща сума</Text>
        <Text style={styles.totalValue}>{item.total?.toFixed(2)} €</Text>
      </View>
    </View>
  );
});

export default function OrdersScreen({ navigation }) {
  const { orders, loading, error } = useOrders();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = useCallback(({ item }) => <OrderCard item={item} />, []);

  const renderSkeletons = () => (
    <View style={{ padding: 16 }}>
      {[0, 1, 2].map(i => <OrderCardSkeleton key={i} />)}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Поръчки</Text>
          <Text style={styles.headerSub}>Зарежда се…</Text>
        </View>
        {renderSkeletons()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color="#E0E0EA" />
          <Text style={styles.errorText}>Грешка при зареждане</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Поръчки</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={72} color="#E0E0EA" />
          <Text style={styles.emptyTitle}>Все още нямате поръчки</Text>
          <Text style={styles.emptyDesc}>
            Направете своята първа поръчка от генерирания списък.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBtnText}>Към начало</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Поръчки</Text>
        <Text style={styles.headerSub}>{orders.length} поръчки</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },
  errorText: { fontSize: 16, color: '#e74c3c', fontWeight: '700', marginTop: 12 },
  errorSub: { fontSize: 13, color: '#aaa', textAlign: 'center' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#999' },

  list: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
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
  orderId: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  dateText: { fontSize: 11, color: '#bbb', fontWeight: '500' },
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
  goalPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalPillText: { fontSize: 12, fontWeight: '700' },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F7F8FC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  storePillText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  productList: { gap: 5, marginBottom: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productIcon: { fontSize: 14, width: 20, textAlign: 'center' },
  productName: { flex: 1, fontSize: 13, color: '#555', fontWeight: '500' },
  productQty: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  moreItems: { fontSize: 12, color: '#9b96d4', fontWeight: '600', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#6C63FF' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 8, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
