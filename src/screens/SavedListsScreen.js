import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import {
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useOrders } from '../hooks/useOrders';

const GOAL_META = {
  cheapest:    { label: 'Най-евтино',       icon: '💰', color: '#f39c12' },
  healthy:     { label: 'Здравословно',     icon: '🥗', color: '#2ecc71' },
  high_protein:{ label: 'Богато на протеин', icon: '💪', color: '#e74c3c' },
};

const CATEGORY_ICONS = {
  meat: '🥩', dairy: '🥛', vegetables: '🥦', fruit: '🍎',
  grains: '🌾', snacks: '🍪', drinks: '🥤', fish: '🐟',
  eggs: '🥚', legumes: '🫘', bakery: '🍞', frozen: '🧊',
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

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

export default function SavedListsScreen({ navigation }) {
  const { orders, loading } = useOrders();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = (order) => {
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
            } catch (err) {
              Alert.alert('Грешка', err.message);
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleViewList = (order) => {
    navigation.navigate('ShoppingList', {
      list: order.items,
      budget: order.total,
      goal: order.goal || 'cheapest',
      store: order.store || 'any',
      readOnly: true,
    });
  };

  const renderItem = ({ item }) => {
    const meta = GOAL_META[item.goal] || GOAL_META.cheapest;
    const isDeleting = deleting === item.id;

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.goalBadge, { backgroundColor: meta.color }]}>
            <Text style={styles.goalBadgeText}>{meta.icon} {meta.label}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color="#e74c3c" />
              : <Text style={styles.deleteBtn}>🗑️</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Date & store */}
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        {item.store && item.store !== 'any' && (
          <Text style={styles.storeText}>📍 {item.store}</Text>
        )}

        {/* Product chips */}
        <View style={styles.chipsRow}>
          {(item.items || []).slice(0, 6).map((p, idx) => (
            <View key={idx} style={styles.chip}>
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
            <Text style={styles.totalValue}>{item.total?.toFixed(2)} лв.</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewList(item)}>
            <Text style={styles.viewBtnText}>Виж списъка →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Запазени списъци 📋</Text>
        <Text style={styles.headerSub}>
          {orders.length > 0
            ? `${orders.length} запазени списъка`
            : 'Все още нямате запазени списъци'}
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Няма запазени списъци</Text>
          <Text style={styles.emptyDesc}>
            Генерирайте списък и го запазете, за да се появи тук.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Home')}
          >
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  goalBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  goalBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  deleteBtn: { fontSize: 20 },

  dateText: { fontSize: 12, color: '#bbb', marginBottom: 2 },
  storeText: { fontSize: 12, color: '#aaa', fontWeight: '600', marginBottom: 10 },

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
  totalLabel: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  viewBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
