import {
  View, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, ReduceMotion,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { getCategoryEmoji, getCategoryColors, CATEGORIES } from './HomeScreen';
import AnimatedPressable from '../components/AnimatedPressable';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
  const opacity = useSharedValue(checked ? 0.45 : 1);
  const scale = useSharedValue(1);
  const isFirstRender = useRef(true);
  useEffect(() => {
    opacity.value = withTiming(checked ? 0.45 : 1, { duration: 220, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System });
    if (!isFirstRender.current) {
      scale.value = withSequence(
        withTiming(0.96, { duration: 90, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }),
      );
    }
    isFirstRender.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchableOpacity
      style={[
        iS.item,
        { backgroundColor: checked ? colors.cardAlt : colors.card },
        animStyle,
      ]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.85}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={item.name}
    >
      {/* CozyList circle checkbox */}
      <View style={[
        iS.checkCircle,
        checked
          ? [iS.checkCircleChecked, { backgroundColor: colors.primary }]
          : [iS.checkCircleUnchecked, { borderColor: colors.border }],
      ]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>

      <View style={[iS.iconWrap, { backgroundColor: catColors.bg }]}>
        <Text style={{ fontSize: 20 }}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={iS.body}>
        <Text style={[iS.name, { color: colors.text }, checked && iS.nameChecked]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? <Text style={[iS.note, { color: colors.textTertiary }]} numberOfLines={1}>📝 {item.note}</Text> : null}
        <Text style={[iS.meta, { color: colors.textQuaternary }]}>{item.price.toFixed(2)} € × {item.quantity}</Text>
      </View>
      <View style={iS.priceCol}>
        <Text style={[iS.price, { color: checked ? colors.textQuaternary : colors.primary }]}>
          {item.subtotal.toFixed(2)} €
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
});

const iS = StyleSheet.create({
  item: { borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  // CozyList-style circle checkbox: accent-filled when checked, outline when not
  checkCircle: { width: 26, height: 26, borderRadius: 13, flexShrink: 0, justifyContent: 'center', alignItems: 'center' },
  checkCircleChecked: { /* background set inline via colors.primary */ },
  checkCircleUnchecked: { borderWidth: 1.5, /* borderColor set inline */ },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  nameChecked: { textDecorationLine: 'line-through' },
  note: { fontSize: 11, marginBottom: 2 },
  meta: { fontSize: 12 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '700' },
  priceStore: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShoppingListScreen({ route, navigation }) {
  const { list, budget, listName, store, readOnly = false } = route.params;
  const { saveList } = useBudgetLists();
  const { show: showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();

  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const progressTrackWidth = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const displayList = useMemo(
    () => activeCat === 'all' ? list : list.filter(i => (i.category || 'other') === activeCat),
    [list, activeCat],
  );

  const usedCats = useMemo(() => {
    const s = new Set(list.map(i => i.category || 'other'));
    return CATEGORIES.filter(c => c.id === 'all' || s.has(c.id));
  }, [list]);

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

  useEffect(() => {
    progressAnim.value = withTiming(progress, { duration: 300, easing: Easing.out(Easing.quart), reduceMotion: ReduceMotion.System });
  }, [progress]);
  const progressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(1 - progressAnim.value) * progressTrackWidth.value }],
  }));

  const toggleCheck = useCallback((id) => {
    Haptics.selectionAsync();
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const checkedItems = list.filter((i) => checked[i.id]);
    const skippedItems = list.filter((i) => !checked[i.id]);
    navigation.navigate('TripSummary', { budget, spent, listName, store, checkedItems, skippedItems });
  };

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
      <View style={s.inner}>

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

        <View
          style={s.progressTrack}
          onLayout={e => { progressTrackWidth.value = e.nativeEvent.layout.width; }}
        >
          <Animated.View style={[s.progressFill, progressAnimStyle]} />
        </View>
        <Text style={s.progressText}>{checkedCount} / {list.length} отметнати</Text>
      </View>

      {/* Budget tracker — CozyHome dashboard card */}
      <View style={s.budgetCard}>
        <View style={s.budgetCardHeader}>
          <Text style={s.budgetCardLabel}>БЮДЖЕТ</Text>
          <View style={[s.budgetBadge, budgetRemaining < 0 ? s.budgetBadgeOver : s.budgetBadgeOk]}>
            <Text style={[s.budgetBadgeText, { color: budgetRemaining < 0 ? colors.red : colors.primary }]}>
              {budgetRemaining < 0 ? 'НАД БЮДЖЕТА' : 'ВСЕ ОЩЕ ОК'}
            </Text>
          </View>
        </View>
        <View style={s.budgetMain}>
          <Text style={[s.budgetJumbo, { color: budgetRemaining < 0 ? colors.red : colors.text }]}>
            {Math.abs(budgetRemaining).toFixed(2)}
          </Text>
          <Text style={s.budgetSuffix}>€ {budgetRemaining < 0 ? 'над' : 'остават'}</Text>
        </View>
        <View style={s.budgetProgressTrack}>
          <View style={[s.budgetProgressFill, {
            width: `${Math.min(100, (spent / budget) * 100)}%`,
            backgroundColor: budgetRemaining < 0 ? colors.red : spent / budget > 0.8 ? colors.orange : colors.primary,
          }]} />
        </View>
        <View style={s.budgetFooter}>
          <Text style={s.budgetFooterText}>{spent.toFixed(2)} € изхарчени</Text>
          <Text style={s.budgetFooterText}>{budget.toFixed(2)} € бюджет</Text>
        </View>
      </View>

      {/* Category filter chips — CozyList style */}
      {usedCats.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catChips}
          keyboardShouldPersistTaps="handled"
        >
          {usedCats.map((cat) => {
            const on = activeCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, on && s.catChipActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveCat(cat.id); }}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={cat.label}
              >
                <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                <Text style={[s.catChipText, on && s.catChipTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <FlashList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={80}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      <AnimatedPressable
        style={s.breakdownToggle}
        onPress={() => { Haptics.selectionAsync(); setShowBreakdown((v) => !v); }}
        accessibilityLabel={showBreakdown ? 'Скрий разбивката' : 'Виж разбивка по категории'}
      >
        <Ionicons name={showBreakdown ? 'chevron-down' : 'pie-chart-outline'} size={15} color={colors.primary} />
        <Text style={s.breakdownToggleText}>
          {showBreakdown ? 'Скрий разбивката' : 'Виж разбивка по категории'}
        </Text>
      </AnimatedPressable>

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
          <AnimatedPressable style={s.btnFinish} onPress={handleFinish} accessibilityLabel="Завърши пазаруването">
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={s.btnFinishText}>Завърши пазаруването</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[s.btnSave, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={s.btnSaveText}>Запази списъка</Text></>
            }
          </AnimatedPressable>
        </View>
      )}

      </View>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    inner: { flex: 1, maxWidth: isTablet ? 720 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' },

    header: { backgroundColor: c.card, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    storeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    storeBadgeText: { fontSize: 12, color: c.primary, fontWeight: '600' },
    shareLiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    shareLiveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    progressTrack: { height: 6, backgroundColor: c.primaryLight, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: 6, width: '100%', backgroundColor: c.primary, borderRadius: 3 },
    progressText: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },

    budgetCard: {
      backgroundColor: c.card, marginHorizontal: 14, marginTop: 12,
      borderRadius: 20, padding: 18,
      shadowColor: c.primary, shadowOpacity: isDark ? 0.15 : 0.1, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    budgetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    budgetCardLabel: { fontSize: 10, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
    budgetBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    budgetBadgeOk: { backgroundColor: c.primaryLight },
    budgetBadgeOver: { backgroundColor: c.redLight },
    budgetBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
    budgetMain: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 },
    budgetJumbo: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40 },
    budgetSuffix: { fontSize: 14, fontWeight: '500', color: c.textSecondary, alignSelf: 'flex-end', marginBottom: 3 },
    budgetProgressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: c.cardAlt, marginBottom: 8 },
    budgetProgressFill: { height: 8, borderRadius: 999 },
    budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    budgetFooterText: { fontSize: 12, color: c.textTertiary, fontWeight: '500' },

    catChips: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, gap: 8 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: c.card, borderRadius: 999,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    catChipActive: { backgroundColor: c.text },
    catChipText: { fontSize: 13, fontWeight: '600', color: c.text },
    catChipTextActive: { color: c.card },

    list: { padding: 14, paddingBottom: 4 },

    breakdownToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginHorizontal: 14, marginBottom: 4 },
    breakdownToggleText: { fontSize: 13, fontWeight: '600', color: c.primary },

    summaryCard: { backgroundColor: c.card, marginHorizontal: 14, marginBottom: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    summaryLabel: { fontSize: 14, color: c.textSecondary, fontWeight: '600' },
    summaryValue: { fontSize: 16, fontWeight: '700', color: c.text },
    summaryRemaining: { fontSize: 18, fontWeight: '700' },
    summaryDivider: { height: 1, backgroundColor: c.borderLight, marginVertical: 4 },

    actions: { paddingHorizontal: 14, paddingBottom: 16, gap: 10 },
    btnFinish: { backgroundColor: c.primary, borderRadius: 999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    btnFinishText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnSave: { backgroundColor: c.card, borderRadius: 999, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSaveText: { color: c.textSecondary, fontWeight: '700', fontSize: 15 },
    btnDisabled: { opacity: 0.6 },
  });
}
