import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { getCategoryEmoji } from './HomeScreen';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts) {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ''; }
}

function useInsights(lists) {
  return useMemo(() => {
    const recent = lists.slice(0, 30);
    if (!recent.length) return null;

    const totalSpent = recent.reduce((s, l) => s + (l.total || 0), 0);
    const totalBudget = recent.reduce((s, l) => s + (l.budget || 0), 0);
    const totalSaved = recent.reduce((s, l) => s + Math.max(0, (l.budget || 0) - (l.total || 0)), 0);
    const avg = totalSpent / recent.length;

    // Store breakdown
    const storeMap = {};
    recent.forEach((l) => {
      const store = l.store && l.store !== 'Всички' ? l.store : null;
      if (!store) return;
      storeMap[store] = (storeMap[store] || 0) + (l.total || 0);
    });
    const maxStore = Math.max(...Object.values(storeMap), 0.01);
    const byStore = Object.entries(storeMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount, pct: (amount / maxStore) * 100 }));

    // Last 6 trips for bar chart
    const chartRaw = recent.slice(0, 6).reverse();
    const maxChartAmt = Math.max(...chartRaw.map(l => l.total || 0), 0.01);
    const chart = chartRaw.map((l) => ({
      label: fmtDate(l.createdAt),
      amount: l.total || 0,
      barH: ((l.total || 0) / maxChartAmt) * 80,
    }));

    // Most bought items
    const itemMap = {};
    recent.forEach((l) => {
      (l.items || []).forEach((item) => {
        const key = item.name.toLowerCase();
        if (!itemMap[key]) itemMap[key] = { name: item.name, count: 0, category: item.category || 'other' };
        itemMap[key].count++;
      });
    });
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { avg, totalSaved, totalBudget, totalSpent, tripsCount: recent.length, byStore, chart, topItems };
  }, [lists]);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SpendingInsightsScreen() {
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const { lists, loading } = useBudgetLists();
  const insights = useInsights(lists);
  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!insights) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
        <View style={s.content}>
          <Text style={[s.title, { color: colors.text }]}>Статистики</Text>
        </View>
        <View style={s.center}>
          <Ionicons name="bar-chart-outline" size={52} color={colors.border} />
          <Text style={[s.emptyTitle, { color: colors.textTertiary }]}>Няма данни</Text>
          <Text style={[s.emptySub, { color: colors.textQuaternary }]}>
            Завърши поне едно пазаруване
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { avg, totalSaved, tripsCount, byStore, chart, topItems } = insights;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0}>
          <Text style={[s.title, { color: colors.text }]}>Статистики</Text>
        </FadeInView>

        {/* KPI row */}
        <FadeInView delay={50}>
          <View style={s.kpiRow}>
            <View style={[s.kpiCell, { backgroundColor: colors.card }]}>
              <Text style={[s.kpiVal, { color: colors.text }]}>{avg.toFixed(0)} лв</Text>
              <Text style={[s.kpiLbl, { color: colors.textTertiary }]}>Средно/пазар</Text>
            </View>
            <View style={[s.kpiCell, { backgroundColor: colors.card }]}>
              <Text style={[s.kpiVal, { color: colors.text }]}>{tripsCount}</Text>
              <Text style={[s.kpiLbl, { color: colors.textTertiary }]}>Пазарувания</Text>
            </View>
            <View style={[s.kpiCell, { backgroundColor: colors.card }]}>
              <Text style={[s.kpiVal, { color: colors.green }]}>{totalSaved.toFixed(0)} лв</Text>
              <Text style={[s.kpiLbl, { color: colors.textTertiary }]}>Спестени</Text>
            </View>
          </View>
        </FadeInView>

        {/* Bar chart */}
        {chart.length > 1 && (
          <FadeInView delay={100}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>ПОСЛЕДНИ ПАЗАРУВАНИЯ</Text>
            <View style={[s.chartCard, { backgroundColor: colors.card }]}>
              {/* budget dashed reference line */}
              <View style={[s.refLine, { borderColor: colors.borderLight }]} />
              <View style={s.bars}>
                {chart.map((c, i) => {
                  const isLast = i === chart.length - 1;
                  return (
                    <View key={i} style={s.barCol}>
                      <View style={[
                        s.bar,
                        {
                          height: Math.max(c.barH, 4),
                          backgroundColor: isLast ? colors.primary : colors.primaryLight,
                        },
                      ]} />
                      <Text style={[s.barLbl, { color: isLast ? colors.primary : colors.textQuaternary }]}>
                        {c.label}
                      </Text>
                      <Text style={[s.barAmt, { color: colors.textTertiary }]}>
                        {c.amount.toFixed(0)} лв
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeInView>
        )}

        {/* By store */}
        {byStore.length > 0 && (
          <FadeInView delay={150}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>ПО МАГАЗИН</Text>
            <View style={[s.card, { backgroundColor: colors.card }]}>
              {byStore.map((store, i) => (
                <View
                  key={store.name}
                  style={[s.storeRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                >
                  <View style={s.storeLeft}>
                    <Text style={[s.storeName, { color: colors.text }]} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <View style={[s.storeTrack, { backgroundColor: colors.primaryLight }]}>
                      <View style={[s.storeFill, { width: `${store.pct}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                  <Text style={[s.storeAmt, { color: colors.textTertiary }]}>
                    {store.amount.toFixed(2)} лв
                  </Text>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

        {/* Top items */}
        {topItems.length > 0 && (
          <FadeInView delay={200}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>НАЙ-КУПУВАНИ ПРОДУКТИ</Text>
            <View style={[s.card, { backgroundColor: colors.card }]}>
              {topItems.map((item, i) => (
                <View
                  key={item.name}
                  style={[s.itemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                >
                  <Text style={{ fontSize: 20, width: 28 }}>{getCategoryEmoji(item.category)}</Text>
                  <Text style={[s.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[s.countBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[s.countText, { color: colors.primary }]}>{item.count}×</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c, isDark, isTablet) {
  const shadow = { shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 6, elevation: 1 };
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: {
      padding: 20, paddingBottom: 44,
      maxWidth: isTablet ? 720 : undefined,
      alignSelf: isTablet ? 'center' : undefined,
      width: '100%',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 16, marginTop: 4 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
    emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
    emptySub: { fontSize: 14, fontWeight: '500' },

    kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    kpiCell: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', ...shadow },
    kpiVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
    kpiLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },

    chartCard: { borderRadius: 14, padding: 16, paddingBottom: 10, marginBottom: 14, ...shadow, position: 'relative' },
    refLine: { position: 'absolute', top: 16, left: 16, right: 16, borderTopWidth: 1, borderStyle: 'dashed' },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, marginTop: 8 },
    barCol: { flex: 1, alignItems: 'center', gap: 5 },
    bar: { width: '100%', borderRadius: 5, minHeight: 4 },
    barLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
    barAmt: { fontSize: 9, fontWeight: '500' },

    card: { borderRadius: 14, paddingHorizontal: 16, marginBottom: 14, ...shadow },
    storeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    storeLeft: { flex: 1, gap: 5 },
    storeName: { fontSize: 14, fontWeight: '600' },
    storeTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
    storeFill: { height: 5, borderRadius: 3 },
    storeAmt: { fontSize: 13, fontWeight: '600', minWidth: 60, textAlign: 'right' },

    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
    itemName: { flex: 1, fontSize: 14, fontWeight: '600' },
    countBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
    countText: { fontSize: 12, fontWeight: '700' },
  });
}
