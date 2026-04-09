import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';

const GOAL_META = {
  cheapest: { label: 'Cheapest', icon: '💰', color: '#f39c12' },
  healthy: { label: 'Healthy', icon: '🥗', color: '#2ecc71' },
  high_protein: { label: 'High Protein', icon: '💪', color: '#e74c3c' },
};

const CATEGORY_ICONS = {
  meat: '🥩',
  dairy: '🥛',
  vegetables: '🥦',
  fruit: '🍎',
  grains: '🌾',
  snacks: '🍪',
  drinks: '🥤',
  fish: '🐟',
  eggs: '🥚',
  legumes: '🫘',
  bakery: '🍞',
  frozen: '🧊',
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category?.toLowerCase()] || '🛒';
}

export default function ShoppingListScreen({ route, navigation }) {
  const { list, budget, goal, store } = route.params;
  const { placeOrder } = useOrders();
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState({});

  const meta = GOAL_META[goal] || GOAL_META.cheapest;
  const total = list.reduce((sum, i) => sum + i.subtotal, 0);
  const remaining = budget - total;
  const totalProtein = list.reduce(
    (sum, i) => sum + ((i.protein || 0) * i.quantity),
    0
  );

  const toggleCheck = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveOrder = async () => {
    Alert.alert('Save Order', 'Save this list to your order history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          setSaving(true);
          try {
            await placeOrder(list, total);
            Alert.alert('Saved!', 'Your shopping list has been saved to orders.', [
              { text: 'OK', onPress: () => navigation.navigate('Orders') },
            ]);
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    const lines = list.map(
      (i) => `• ${i.name} x${i.quantity} — BGN ${i.subtotal.toFixed(2)}`
    );
    const text = [
      `Smart Budget Shopping List`,
      `Goal: ${meta.label} | Store: ${store === 'any' ? 'Any' : store}`,
      `Budget: BGN ${budget.toFixed(2)}`,
      '',
      ...lines,
      '',
      `Total: BGN ${total.toFixed(2)}`,
      `Remaining: BGN ${remaining.toFixed(2)}`,
    ].join('\n');

    await Share.share({ message: text });
  };

  const renderItem = ({ item }) => {
    const isChecked = checked[item.id];
    return (
      <TouchableOpacity
        style={[styles.item, isChecked && styles.itemChecked]}
        onPress={() => toggleCheck(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.itemCheck}>
          <Text style={styles.checkIcon}>{isChecked ? '✅' : '⬜'}</Text>
        </View>
        <View style={styles.itemIconWrap}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemStore}>{item.store !== 'Any' ? item.store : store !== 'any' ? store : 'Any store'}</Text>
            {item.protein > 0 && (
              <Text style={styles.itemProtein}>💪 {item.protein}g protein</Text>
            )}
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemQty}>×{item.quantity}</Text>
          <Text style={styles.itemPrice}>BGN {item.subtotal.toFixed(2)}</Text>
          <Text style={styles.itemUnit}>BGN {item.price.toFixed(2)}/{item.unit}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={[styles.summaryCard, { borderLeftColor: meta.color }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryGoal}>
              {meta.icon} {meta.label} List
            </Text>
            <Text style={styles.summaryStore}>
              {store === 'any' ? 'All Stores' : store} · {list.length} items
            </Text>
          </View>
          <View style={styles.summaryActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Text style={styles.iconBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>BGN {total.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Cost</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
              BGN {Math.abs(remaining).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>{remaining >= 0 ? 'Under budget' : 'Over budget'}</Text>
          </View>
          {goal === 'high_protein' && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalProtein.toFixed(0)}g</Text>
                <Text style={styles.statLabel}>Est. Protein</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Adjust</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveOrder}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryGoal: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  summaryStore: { fontSize: 13, color: '#999', marginTop: 2 },
  summaryActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    backgroundColor: '#F0EEFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  iconBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },

  summaryStats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#eee' },

  list: { paddingHorizontal: 16, paddingBottom: 12 },

  item: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  itemChecked: { opacity: 0.5 },

  itemCheck: { marginRight: 8 },
  checkIcon: { fontSize: 18 },

  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: { fontSize: 20 },

  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#aaa' },
  itemMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  itemStore: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  itemProtein: { fontSize: 11, color: '#e74c3c', fontWeight: '600' },

  itemRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 13, color: '#999', fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#6C63FF' },
  itemUnit: { fontSize: 10, color: '#ccc', marginTop: 1 },

  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
  },
  backBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
