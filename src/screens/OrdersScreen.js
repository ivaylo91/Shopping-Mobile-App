import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useOrders } from '../hooks/useOrders';

const STATUS_COLORS = {
  pending: '#f39c12',
  processing: '#3498db',
  shipped: '#9b59b6',
  delivered: '#2ecc71',
  cancelled: '#e74c3c',
};

export default function OrdersScreen() {
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No orders yet.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const date = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : 'Pending';
    const statusColor = STATUS_COLORS[item.status] || '#999';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.date}>{date}</Text>
        {item.items.map((p, idx) => (
          <Text key={idx} style={styles.product}>
            {p.name} x{p.quantity}
          </Text>
        ))}
        <Text style={styles.total}>Total: ${item.total?.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#333' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  date: { color: '#999', fontSize: 12, marginBottom: 10 },
  product: { fontSize: 14, color: '#555', marginBottom: 2 },
  total: { fontSize: 15, fontWeight: '700', color: '#6C63FF', marginTop: 8 },
});
