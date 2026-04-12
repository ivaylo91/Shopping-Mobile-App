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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, memo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { getCategoryIcon, GOAL_META } from '../utils/ui';

// ─── Memoized list item ───────────────────────────────────────────────────────

const ShoppingItem = memo(function ShoppingItem({ item, isChecked, onToggle, store }) {
  return (
    <TouchableOpacity
      style={[styles.item, isChecked && styles.itemChecked]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
    >
      <Text style={styles.checkIcon}>{isChecked ? '✅' : '⬜'}</Text>
      <View style={styles.itemIconWrap}>
        <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemStore}>
            {item.store && item.store !== 'Any'
              ? item.store
              : store !== 'any'
              ? store
              : 'Всеки магазин'}
          </Text>
          {(item.protein || 0) > 0 && (
            <Text style={styles.itemProtein}>💪 {item.protein}г протеин</Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemQty}>×{item.quantity}</Text>
        <Text style={styles.itemPrice}>{item.subtotal.toFixed(2)} €</Text>
        <Text style={styles.itemUnit}>{item.price.toFixed(2)} €/{item.unit || 'бр.'}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShoppingListScreen({ route, navigation }) {
  const { list, budget, goal, store, readOnly = false } = route.params;
  const { placeOrder } = useOrders();
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState({});

  const meta = GOAL_META[goal] || GOAL_META.cheapest;

  const { total, remaining, totalProtein } = useMemo(() => {
    const t = list.reduce((sum, i) => sum + i.subtotal, 0);
    return {
      total: t,
      remaining: budget - t,
      totalProtein: list.reduce((sum, i) => sum + (i.protein || 0) * i.quantity, 0),
    };
  }, [list, budget]);

  const toggleCheck = useCallback(
    (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  const handleSave = async () => {
    Alert.alert('Запази списъка', 'Искате ли да запазите този списък в историята?', [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Запази',
        onPress: async () => {
          setSaving(true);
          try {
            await placeOrder(list, total, goal, store);
            Alert.alert('Запазено!', 'Списъкът е добавен в историята на поръчките.', [
              { text: 'OK', onPress: () => navigation.navigate('Orders') },
            ]);
          } catch (err) {
            Alert.alert('Грешка', err?.message || 'Неуспешно запазване');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    const lines = list.map(
      (i) => `• ${i.name} x${i.quantity} — ${i.subtotal.toFixed(2)} €`
    );
    const text = [
      'Списък за пазаруване — Smart Budget Shopping',
      `Цел: ${meta.label} | Магазин: ${store === 'any' ? 'Всички' : store}`,
      `Бюджет: ${budget.toFixed(2)} €`,
      '',
      ...lines,
      '',
      `Обща сума: ${total.toFixed(2)} €`,
      `Оставащо: ${remaining.toFixed(2)} €`,
    ].join('\n');
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Грешка', 'Споделянето е неуспешно.');
    }
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ShoppingItem
        item={item}
        isChecked={!!checked[item.id]}
        onToggle={toggleCheck}
        store={store}
      />
    ),
    [checked, toggleCheck, store]
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={[styles.headerBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.headerBadgeText}>{meta.icon} {meta.label}</Text>
        </View>
        <Text style={styles.headerTitle}>В рамките на бюджета</Text>
        <Text style={styles.headerSub}>
          {store === 'any' ? 'Всички магазини' : store} · {list.length} продукта
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Сподели ↗</Text>
        </TouchableOpacity>
      </View>

      {/* ── Grocery List ── */}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {/* ── Totals ── */}
      <View style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Обща сума</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Оставащо</Text>
          <Text style={[
            styles.totalValue,
            { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }
          ]}>
            {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)} €
          </Text>
        </View>
        {goal === 'high_protein' && (
          <>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Общо протеин</Text>
              <Text style={[styles.totalValue, { color: '#e74c3c' }]}>
                ~{totalProtein.toFixed(0)}г
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actions}>
        {!readOnly && (
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>🔄 Генерирай{'\n'}отново</Text>
          </TouchableOpacity>
        )}

        {!readOnly && (
          <TouchableOpacity
            style={[styles.btnPrimary, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>💾 Запази{'\n'}списъка</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnMeals, readOnly && styles.btnMealsFull]}
          onPress={() => navigation.navigate('Meals', { list, goal })}
        >
          <Text style={styles.btnMealsText}>🍽️ Виж{'\n'}ястията</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  /* Header */
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#999', marginBottom: 10 },
  shareBtn: { alignSelf: 'flex-start' },
  shareBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },

  /* List */
  list: { padding: 14, paddingBottom: 4 },
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
  itemChecked: { opacity: 0.45 },
  checkIcon: { fontSize: 18, marginRight: 8 },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: { fontSize: 20 },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#bbb' },
  itemMeta: { flexDirection: 'row', gap: 8 },
  itemStore: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  itemProtein: { fontSize: 11, color: '#e74c3c', fontWeight: '600' },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 12, color: '#aaa' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#6C63FF' },
  itemUnit: { fontSize: 10, color: '#ccc', marginTop: 1 },

  /* Totals */
  totalsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalLabel: { fontSize: 15, color: '#555', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 2 },

  /* Buttons */
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#F0EEFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#6C63FF', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnMeals: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMealsFull: { flex: 3 },
  btnMealsText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
