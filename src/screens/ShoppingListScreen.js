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
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useToast } from '../context/ToastContext';
import { getCategoryEmoji, CATEGORIES } from './HomeScreen';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Category breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ items }) {
  const breakdown = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const cat = item.category || 'other';
      if (!map[cat]) map[cat] = 0;
      map[cat] += item.subtotal;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([id, amount]) => {
        const meta = CATEGORIES.find((c) => c.id === id) || { emoji: '📦', label: 'Друго' };
        return { id, amount, pct: total > 0 ? (amount / total) * 100 : 0, ...meta };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [items]);

  if (breakdown.length === 0) return null;

  return (
    <View style={bdStyles.container}>
      <Text style={bdStyles.title}>Разбивка по категории</Text>
      {breakdown.map((cat) => (
        <View key={cat.id} style={bdStyles.row}>
          <Text style={bdStyles.emoji}>{cat.emoji}</Text>
          <View style={bdStyles.barWrap}>
            <View style={bdStyles.barTrack}>
              <View style={[bdStyles.barFill, { width: `${cat.pct}%` }]} />
            </View>
            <Text style={bdStyles.label}>{cat.label}</Text>
          </View>
          <View style={bdStyles.right}>
            <Text style={bdStyles.amount}>{cat.amount.toFixed(2)} лв.</Text>
            <Text style={bdStyles.pct}>{cat.pct.toFixed(0)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const bdStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 10,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  emoji: { fontSize: 20, width: 28 },
  barWrap: { flex: 1, gap: 3 },
  barTrack: { height: 6, backgroundColor: '#F0EEFF', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#6C63FF', borderRadius: 3 },
  label: { fontSize: 12, color: '#888', fontWeight: '600' },
  right: { alignItems: 'flex-end', minWidth: 68 },
  amount: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  pct: { fontSize: 11, color: '#aaa' },
});

// ─── Item row ─────────────────────────────────────────────────────────────────

const ShoppingItem = memo(function ShoppingItem({ item, checked, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.item, checked && styles.itemChecked]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
    >
      <View style={styles.checkBox}>
        {checked
          ? <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          : <Ionicons name="ellipse-outline" size={24} color="#ddd" />}
      </View>
      <View style={styles.itemIconWrap}>
        <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, checked && styles.itemNameChecked]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? <Text style={styles.itemNote} numberOfLines={1}>📝 {item.note}</Text> : null}
        <Text style={styles.itemMeta}>{item.price.toFixed(2)} лв. × {item.quantity}</Text>
      </View>
      <Text style={[styles.itemPrice, checked && styles.itemPriceChecked]}>
        {item.subtotal.toFixed(2)} лв.
      </Text>
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShoppingListScreen({ route, navigation }) {
  const { list, budget, listName, store, readOnly = false } = route.params;
  const { saveList } = useBudgetLists();
  const { show: showToast } = useToast();

  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { total, spent, budgetRemaining, checkedCount, progress } = useMemo(() => {
    const t = list.reduce((s, i) => s + i.subtotal, 0);
    const sp = list.reduce((s, i) => (checked[i.id] ? s + i.subtotal : s), 0);
    const cnt = Object.values(checked).filter(Boolean).length;
    return {
      total: t,
      spent: sp,
      budgetRemaining: budget - sp,
      checkedCount: cnt,
      progress: list.length > 0 ? cnt / list.length : 0,
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
      await saveList({ name: listName, budget, store, items: list });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Списъкът е запазен!', 'success');
      setTimeout(() => navigation.navigate('SavedLists'), 900);
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
      (i) => `${getCategoryEmoji(i.category)} ${i.name} ×${i.quantity} — ${i.subtotal.toFixed(2)} лв.${i.note ? ` (${i.note})` : ''}`
    );
    const text = [
      `📋 ${listName || 'Списък за пазаруване'}`,
      store !== 'Всички' ? `📍 ${store}` : '',
      `💰 Бюджет: ${budget.toFixed(2)} лв.`,
      '',
      ...lines,
      '',
      `Общо: ${total.toFixed(2)} лв.`,
      `Оставащо: ${(budget - total).toFixed(2)} лв.`,
    ].filter(Boolean).join('\n');
    try { await Share.share({ message: text }); }
    catch { showToast('Споделянето е неуспешно', 'error'); }
  };

  const renderItem = useCallback(
    ({ item }) => <ShoppingItem item={item} checked={!!checked[item.id]} onToggle={toggleCheck} />,
    [checked, toggleCheck]
  );

  const barWidth = `${Math.min(progress * 100, 100)}%`;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{listName || 'Списък'}</Text>
            {store !== 'Всички' && (
              <View style={styles.storeBadge}>
                <Ionicons name="location-outline" size={11} color="#6C63FF" />
                <Text style={styles.storeBadgeText}>{store}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={22} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: barWidth }]} />
        </View>
        <Text style={styles.progressText}>{checkedCount} / {list.length} отметнати</Text>
      </View>

      {/* Budget tracker */}
      <View style={styles.budgetBar}>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Бюджет</Text>
          <Text style={styles.budgetStatValue}>{budget.toFixed(2)} лв.</Text>
        </View>
        <View style={styles.budgetDivider} />
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Изхарчено</Text>
          <Text style={[styles.budgetStatValue, { color: '#e67e22' }]}>{spent.toFixed(2)} лв.</Text>
        </View>
        <View style={styles.budgetDivider} />
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Оставащо</Text>
          <Text style={[styles.budgetStatValue, { color: budgetRemaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            {budgetRemaining.toFixed(2)} лв.
          </Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={12}
      />

      {/* Category breakdown toggle */}
      <TouchableOpacity
        style={styles.breakdownToggle}
        onPress={() => { Haptics.selectionAsync(); setShowBreakdown((v) => !v); }}
        activeOpacity={0.8}
      >
        <Ionicons name={showBreakdown ? 'chevron-down' : 'pie-chart-outline'} size={15} color="#6C63FF" />
        <Text style={styles.breakdownToggleText}>
          {showBreakdown ? 'Скрий разбивката' : 'Виж разбивка по категории'}
        </Text>
      </TouchableOpacity>

      {showBreakdown && <CategoryBreakdown items={list} />}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Общо в списъка</Text>
          <Text style={styles.summaryValue}>{total.toFixed(2)} лв.</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Бюджет след пазаруване</Text>
          <Text style={[styles.summaryRemaining, { color: budget - total >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            {(budget - total >= 0 ? '+' : '') + (budget - total).toFixed(2)} лв.
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      {!readOnly && (
        <View style={styles.actions}>
          <AnimatedPressable
            style={[styles.btnSave, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={styles.btnSaveText}>Запази списъка</Text></>
            }
          </AnimatedPressable>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  header: {
    backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  backBtn: { padding: 2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  storeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  storeBadgeText: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },

  progressTrack: { height: 6, backgroundColor: '#F0EEFF', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#6C63FF', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  budgetBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: 12, borderRadius: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 4 },
  budgetStatValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  budgetDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

  list: { padding: 14, paddingBottom: 4 },
  item: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
  },
  itemChecked: { opacity: 0.45 },
  checkBox: {},
  itemIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 1 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#bbb' },
  itemNote: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#aaa' },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#6C63FF' },
  itemPriceChecked: { color: '#ccc' },

  breakdownToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginHorizontal: 14, marginBottom: 4,
  },
  breakdownToggleText: { fontSize: 13, fontWeight: '700', color: '#6C63FF' },

  summaryCard: {
    backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 10,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  summaryLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  summaryRemaining: { fontSize: 20, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },

  actions: { paddingHorizontal: 14, paddingBottom: 16 },
  btnSave: {
    backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
});
