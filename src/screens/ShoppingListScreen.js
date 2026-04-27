import {
  View, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getCategoryEmoji, getCategoryColors, CATEGORIES } from './HomeScreen';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Category Breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ items, colors }) {
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
    <View style={[bdS.container, { backgroundColor: colors.card }]}>
      <Text style={[bdS.title, { color: colors.textTertiary }]}>Разбивка по категории</Text>
      {breakdown.map((cat) => (
        <View key={cat.id} style={bdS.row}>
          <Text style={{ fontSize: 20, width: 28 }}>{cat.emoji}</Text>
          <View style={bdS.barWrap}>
            <View style={[bdS.barTrack, { backgroundColor: colors.primaryLight }]}>
              <View style={[bdS.barFill, { width: `${cat.pct}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[bdS.label, { color: colors.textTertiary }]}>{cat.label}</Text>
          </View>
          <View style={bdS.right}>
            <Text style={[bdS.amount, { color: colors.text }]}>{cat.amount.toFixed(2)} €</Text>
            <Text style={[bdS.pct, { color: colors.textTertiary }]}>{cat.pct.toFixed(0)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const bdS = StyleSheet.create({
  container: { marginHorizontal: 14, marginBottom: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  barWrap: { flex: 1, gap: 3 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '600' },
  right: { alignItems: 'flex-end', minWidth: 68 },
  amount: { fontSize: 13, fontWeight: '600' },
  pct: { fontSize: 11 },
});

// ─── Item Row ─────────────────────────────────────────────────────────────────

const ShoppingItem = memo(function ShoppingItem({ item, checked, onToggle, colors, isDark }) {
  const catColors = getCategoryColors(item.category, isDark);
  return (
    <TouchableOpacity
      style={[iS.item, { backgroundColor: colors.card }, checked && iS.itemChecked]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={item.name}
    >
      <View>
        {checked
          ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          : <Ionicons name="ellipse-outline" size={24} color={colors.border} />}
      </View>
      <View style={[iS.iconWrap, { backgroundColor: catColors.bg }]}>
        <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={iS.body}>
        <Text style={[iS.name, { color: colors.text }, checked && iS.nameChecked]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? <Text style={[iS.note, { color: colors.textTertiary }]} numberOfLines={1}>📝 {item.note}</Text> : null}
        <Text style={[iS.meta, { color: colors.textQuaternary }]}>{item.price.toFixed(2)} € × {item.quantity}</Text>
      </View>
      <Text style={[iS.price, { color: colors.primary }, checked && { color: colors.border }]}>
        {item.subtotal.toFixed(2)} €
      </Text>
    </TouchableOpacity>
  );
});

const iS = StyleSheet.create({
  item: { borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
  itemChecked: { opacity: 0.45 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  nameChecked: { textDecorationLine: 'line-through' },
  note: { fontSize: 11, marginBottom: 2 },
  meta: { fontSize: 12 },
  price: { fontSize: 15, fontWeight: '600' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShoppingListScreen({ route, navigation }) {
  const { list, budget, listName, store, readOnly = false } = route.params;
  const { saveList } = useBudgetLists();
  const { show: showToast } = useToast();
  const { colors, isDark } = useTheme();

  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const { total, spent, budgetRemaining, checkedCount, progress } = useMemo(() => {
    const t = list.reduce((s, i) => s + i.subtotal, 0);
    const sp = list.reduce((s, i) => (checked[i.id] ? s + i.subtotal : s), 0);
    const cnt = Object.values(checked).filter(Boolean).length;
    return {
      total: t, spent: sp,
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
      (i) => `${getCategoryEmoji(i.category)} ${i.name} ×${i.quantity} — ${i.subtotal.toFixed(2)} €${i.note ? ` (${i.note})` : ''}`
    );
    const text = [
      `📋 ${listName || 'Списък за пазаруване'}`,
      store !== 'Всички' ? `📍 ${store}` : '',
      `💰 Бюджет: ${budget.toFixed(2)} €`,
      '',
      ...lines,
      '',
      `Общо: ${total.toFixed(2)} €`,
      `Оставащо: ${(budget - total).toFixed(2)} €`,
    ].filter(Boolean).join('\n');
    try { await Share.share({ message: text }); }
    catch { showToast('Споделянето е неуспешно', 'error'); }
  };

  const handleShareLive = () => {
    if (!readOnly && list.length === 0) { showToast('Добавете продукти преди споделяне', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    navigation.navigate('SharedList', { code, isOwner: true, list, budget, listName, store });
  };

  const renderItem = useCallback(
    ({ item }) => <ShoppingItem item={item} checked={!!checked[item.id]} onToggle={toggleCheck} colors={colors} isDark={isDark} />,
    [checked, toggleCheck, colors, isDark]
  );

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ padding: 2 }} accessibilityLabel="Назад" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>{listName || 'Списък'}</Text>
            {store !== 'Всички' && (
              <View style={s.storeBadge}>
                <Ionicons name="location-outline" size={11} color={colors.primary} />
                <Text style={s.storeBadgeText}>{store}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleShareLive} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.shareLiveBtn} accessibilityLabel="Сподели на живо" accessibilityRole="button">
            <Ionicons name="people-outline" size={16} color="#fff" />
            <Text style={s.shareLiveBtnText}>Live</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Сподели списъка" accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={s.progressText}>{checkedCount} / {list.length} отметнати</Text>
      </View>

      {/* Budget tracker */}
      <View style={s.budgetBar}>
        <View style={s.budgetStat}>
          <Text style={s.budgetStatLabel}>Бюджет</Text>
          <Text style={s.budgetStatValue}>{budget.toFixed(2)} €</Text>
        </View>
        <View style={s.budgetDivider} />
        <View style={s.budgetStat}>
          <Text style={s.budgetStatLabel}>Изхарчено</Text>
          <Text style={[s.budgetStatValue, { color: colors.orange }]}>{spent.toFixed(2)} €</Text>
        </View>
        <View style={s.budgetDivider} />
        <View style={s.budgetStat}>
          <Text style={s.budgetStatLabel}>Оставащо</Text>
          <Text style={[s.budgetStatValue, { color: budgetRemaining >= 0 ? colors.green : colors.red }]}>
            {budgetRemaining.toFixed(2)} €
          </Text>
        </View>
      </View>

      <FlashList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={80}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={s.breakdownToggle}
        onPress={() => { Haptics.selectionAsync(); setShowBreakdown((v) => !v); }}
        activeOpacity={0.8}
        accessibilityLabel={showBreakdown ? 'Скрий разбивката' : 'Виж разбивка по категории'}
        accessibilityRole="button"
      >
        <Ionicons name={showBreakdown ? 'chevron-down' : 'pie-chart-outline'} size={15} color={colors.primary} />
        <Text style={s.breakdownToggleText}>
          {showBreakdown ? 'Скрий разбивката' : 'Виж разбивка по категории'}
        </Text>
      </TouchableOpacity>

      {showBreakdown && <CategoryBreakdown items={list} colors={colors} />}

      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Общо в списъка</Text>
          <Text style={s.summaryValue}>{total.toFixed(2)} €</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Бюджет след пазаруване</Text>
          <Text style={[s.summaryRemaining, { color: budget - total >= 0 ? colors.green : colors.red }]}>
            {(budget - total >= 0 ? '+' : '') + (budget - total).toFixed(2)} €
          </Text>
        </View>
      </View>

      {!readOnly && (
        <View style={s.actions}>
          <AnimatedPressable style={[s.btnSave, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={s.btnSaveText}>Запази списъка</Text></>
            }
          </AnimatedPressable>
        </View>
      )}

    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },

    header: { backgroundColor: c.card, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    storeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    storeBadgeText: { fontSize: 12, color: c.primary, fontWeight: '600' },
    shareLiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    shareLiveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    progressTrack: { height: 6, backgroundColor: c.primaryLight, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: 6, backgroundColor: c.primary, borderRadius: 3 },
    progressText: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },

    budgetBar: { flexDirection: 'row', backgroundColor: c.card, marginHorizontal: 14, marginTop: 12, borderRadius: 14, paddingVertical: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 6, elevation: 2 },
    budgetStat: { flex: 1, alignItems: 'center' },
    budgetStatLabel: { fontSize: 11, color: c.textTertiary, fontWeight: '600', marginBottom: 4 },
    budgetStatValue: { fontSize: 15, fontWeight: '600', color: c.text },
    budgetDivider: { width: 1, backgroundColor: c.border, marginVertical: 4 },

    list: { padding: 14, paddingBottom: 4 },

    breakdownToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginHorizontal: 14, marginBottom: 4 },
    breakdownToggleText: { fontSize: 13, fontWeight: '600', color: c.primary },

    summaryCard: { backgroundColor: c.card, marginHorizontal: 14, marginBottom: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    summaryLabel: { fontSize: 14, color: c.textSecondary, fontWeight: '600' },
    summaryValue: { fontSize: 16, fontWeight: '700', color: c.text },
    summaryRemaining: { fontSize: 18, fontWeight: '700' },
    summaryDivider: { height: 1, backgroundColor: c.borderLight, marginVertical: 4 },

    actions: { paddingHorizontal: 14, paddingBottom: 16 },
    btnSave: { backgroundColor: c.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  });
}
