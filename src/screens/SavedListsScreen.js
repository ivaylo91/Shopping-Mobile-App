import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, memo } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { db } from '../config/firebase';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../context/ToastContext';
import { getCategoryIcon, GOAL_META } from '../utils/ui';
import { OrderCardSkeleton } from '../components/Skeleton';

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—';
  const d = timestamp.toDate();
  return d.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Memoized card ────────────────────────────────────────────────────────────

const OrderCard = memo(function OrderCard({ item, isDeleting, onDelete, onView }) {
  const meta = GOAL_META[item.goal] || GOAL_META.cheapest;

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.goalBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.goalBadgeText}>{meta.icon} {meta.label}</Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          disabled={isDeleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color="#e74c3c" />
            : <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          }
        </TouchableOpacity>
      </View>

      {/* Date & store */}
      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      {item.store && item.store !== 'any' && (
        <View style={styles.storeRow}>
          <Ionicons name="location-outline" size={12} color="#aaa" />
          <Text style={styles.storeText}>{item.store}</Text>
        </View>
      )}

      {/* Product chips */}
      <View style={styles.chipsRow}>
        {(item.items || []).slice(0, 6).map((p) => (
          <View key={`${item.id}-${p.id}`} style={styles.chip}>
            <Text style={styles.chipIcon}>{getCategoryIcon(p.category)}</Text>
            <Text style={styles.chipText} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.chipQty}>×{p.quantity}</Text>
          </View>
        ))}
        {(item.items || []).length > 6 && (
          <View style={[styles.chip, styles.chipMore]}>
            <Text style={styles.chipMoreText}>+{item.items.length - 6}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Обща сума</Text>
          <Text style={styles.totalValue}>{item.total?.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.85}>
          <Text style={styles.viewBtnText}>Виж</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedListsScreen({ navigation }) {
  const { orders, loading, error } = useOrders();
  const { show: showToast } = useToast();
  const [deleting, setDeleting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    // Real-time listener updates automatically; brief visual feedback only
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleDelete = useCallback((order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Изтрий списъка',
      'Сигурни ли сте, че искате да изтриете този списък?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            setDeleting(order.id);
            try {
              await deleteDoc(doc(db, 'orders', order.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Списъкът е изтрит', 'info');
            } catch (err) {
              showToast(err?.message || 'Неуспешно изтриване', 'error');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  }, [showToast]);

  const handleViewList = useCallback((order) => {
    Haptics.selectionAsync();
    navigation.navigate('ShoppingList', {
      list: order.items,
      budget: order.total,
      goal: order.goal || 'cheapest',
      store: order.store || 'any',
      readOnly: true,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <OrderCard
      item={item}
      isDeleting={deleting === item.id}
      onDelete={() => handleDelete(item)}
      onView={() => handleViewList(item)}
    />
  ), [deleting, handleDelete, handleViewList]);

  const renderSkeletons = () => (
    <View style={{ padding: 16 }}>
      {[0, 1, 2].map(i => <OrderCardSkeleton key={i} />)}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Запазени списъци</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Запазени списъци</Text>
        <Text style={styles.headerSub}>
          {orders.length > 0
            ? `${orders.length} запазени`
            : 'Все още нямате списъци'}
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={72} color="#E0E0EA" />
          <Text style={styles.emptyTitle}>Няма запазени списъци</Text>
          <Text style={styles.emptyDesc}>
            Генерирайте списък и го запазете, за да се появи тук.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Генерирай списък</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={8}
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
      )}
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
    alignItems: 'center',
    marginBottom: 8,
  },
  goalBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  goalBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  dateText: { fontSize: 12, color: '#bbb', marginBottom: 4 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  storeText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
    maxWidth: 130,
  },
  chipIcon: { fontSize: 12 },
  chipText: { fontSize: 11, fontWeight: '600', color: '#444', flex: 1 },
  chipQty: { fontSize: 11, color: '#aaa' },
  chipMore: { backgroundColor: '#eee' },
  chipMoreText: { fontSize: 12, fontWeight: '700', color: '#888' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  viewBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

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
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
