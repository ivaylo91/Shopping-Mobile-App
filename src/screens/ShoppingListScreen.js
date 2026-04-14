import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../context/ToastContext';
import { getCategoryIcon, GOAL_META } from '../utils/ui';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Memoized list item ───────────────────────────────────────────────────────

const ShoppingItem = memo(function ShoppingItem({ item, isChecked, onToggle, store }) {
  return (
    <TouchableOpacity
      style={[styles.item, isChecked && styles.itemChecked]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
    >
      <View style={styles.checkBox}>
        {isChecked
          ? <Ionicons name="checkmark-circle" size={22} color="#6C63FF" />
          : <Ionicons name="ellipse-outline" size={22} color="#ddd" />
        }
      </View>
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
            <Text style={styles.itemProtein}>💪 {item.protein}г</Text>
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
  const { show: showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState({});

  const meta = GOAL_META[goal] || GOAL_META.cheapest;

  const { total, remaining, totalProtein, checkedCount } = useMemo(() => {
    const t = list.reduce((sum, i) => sum + i.subtotal, 0);
    return {
      total: t,
      remaining: budget - t,
      totalProtein: list.reduce((sum, i) => sum + (i.protein || 0) * i.quantity, 0),
      checkedCount: Object.values(checked).filter(Boolean).length,
    };
  }, [list, budget, checked]);

  const toggleCheck = useCallback((id) => {
    Haptics.selectionAsync();
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await placeOrder(list, total, goal, store);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Списъкът е запазен успешно!', 'success');
      setTimeout(() => navigation.navigate('SavedLists'), 1200);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err?.message || 'Неуспешно запазване', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      showToast('Споделянето е неуспешно', 'error');
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
        <View style={styles.headerTop}>
          <View style={[styles.headerBadge, { backgroundColor: meta.color }]}>
            <Text style={styles.headerBadgeText}>{meta.icon} {meta.label}</Text>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={18} color="#6C63FF" />
            <Text style={styles.shareBtnText}>Сподели</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>В рамките на бюджета</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSub}>
            {store === 'any' ? 'Всички магазини' : store} · {list.length} продукта
          </Text>
          {checkedCount > 0 && (
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{checkedCount}/{list.length} отметнати</Text>
            </View>
          )}
        </View>
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
          <Text style={[styles.totalValue, { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
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
          <AnimatedPressable
            style={styles.btnSecondary}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Ionicons name="refresh" size={16} color="#6C63FF" />
            <Text style={styles.btnSecondaryText}>Генерирай{'\n'}отново</Text>
          </AnimatedPressable>
        )}

        {!readOnly && (
          <AnimatedPressable
            style={[styles.btnPrimary, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="bookmark-outline" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Запази{'\n'}списъка</Text>
              </>
            )}
          </AnimatedPressable>
        )}

        <AnimatedPressable
          style={[styles.btnMeals, readOnly && styles.btnMealsFull]}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('Meals', { list, goal });
          }}
        >
          <Text style={styles.btnMealsIcon}>🍽️</Text>
          <Text style={styles.btnMealsText}>Виж{'\n'}ястията</Text>
        </AnimatedPressable>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSub: { fontSize: 13, color: '#999' },
  progressPill: {
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  progressText: { fontSize: 11, color: '#6C63FF', fontWeight: '700' },

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
  checkBox: { marginRight: 10 },
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
    gap: 4,
  },
  btnSecondaryText: { color: '#6C63FF', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnMeals: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnMealsFull: { flex: 3 },
  btnMealsIcon: { fontSize: 18 },
  btnMealsText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
