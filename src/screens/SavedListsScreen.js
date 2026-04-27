import {
  View, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, memo, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useTemplates } from '../hooks/useTemplates';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getCategoryEmoji } from './HomeScreen';
import { OrderCardSkeleton } from '../components/Skeleton';

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—';
  return timestamp.toDate().toLocaleDateString('bg-BG', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatMonth(timestamp) {
  if (!timestamp?.toDate) return null;
  return timestamp.toDate().toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
}

// ─── Monthly Summary ───────────────────────────────────────────────────────────

function MonthlySummary({ lists, colors }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = lists.filter((l) => {
      if (!l.createdAt?.toDate) return false;
      const d = l.createdAt.toDate();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalSpent = thisMonth.reduce((s, l) => s + (l.total || 0), 0);
    const totalBudget = thisMonth.reduce((s, l) => s + (l.budget || 0), 0);
    const overCount = thisMonth.filter((l) => (l.total || 0) > (l.budget || 0)).length;
    const firstWithDate = thisMonth.find((l) => l.createdAt?.toDate);
    const monthName = firstWithDate ? formatMonth(firstWithDate.createdAt) : null;
    return { count: thisMonth.length, totalSpent, totalBudget, overCount, monthName };
  }, [lists]);

  if (stats.count === 0) return null;
  const saved = stats.totalBudget - stats.totalSpent;

  return (
    <View style={[msS.card, { backgroundColor: colors.card, borderColor: colors.primaryLight }]}>
      <View style={msS.header}>
        <View style={[msS.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="stats-chart" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[msS.title, { color: colors.text }]}>Обобщение за месеца</Text>
          {stats.monthName && <Text style={[msS.month, { color: colors.textTertiary }]}>{stats.monthName}</Text>}
        </View>
      </View>
      <View style={msS.statsRow}>
        <View style={msS.stat}>
          <Text style={[msS.statValue, { color: colors.text }]}>{stats.count}</Text>
          <Text style={[msS.statLabel, { color: colors.textTertiary }]}>Списъка</Text>
        </View>
        <View style={[msS.divider, { backgroundColor: colors.border }]} />
        <View style={msS.stat}>
          <Text style={[msS.statValue, { color: colors.text }]}>{stats.totalSpent.toFixed(0)} €</Text>
          <Text style={[msS.statLabel, { color: colors.textTertiary }]}>Изхарчено</Text>
        </View>
        <View style={[msS.divider, { backgroundColor: colors.border }]} />
        <View style={msS.stat}>
          <Text style={[msS.statValue, { color: saved >= 0 ? colors.green : colors.red }]}>
            {saved >= 0 ? '+' : ''}{saved.toFixed(0)} €
          </Text>
          <Text style={[msS.statLabel, { color: colors.textTertiary }]}>{saved >= 0 ? 'Спестено' : 'Над бюджета'}</Text>
        </View>
        {stats.overCount > 0 && (
          <>
            <View style={[msS.divider, { backgroundColor: colors.border }]} />
            <View style={msS.stat}>
              <Text style={[msS.statValue, { color: colors.red }]}>{stats.overCount}</Text>
              <Text style={[msS.statLabel, { color: colors.textTertiary }]}>Превишени</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const msS = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
  month: { fontSize: 12, marginTop: 1, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600' },
  divider: { width: 1, height: 28 },
});

// ─── Budget Card ──────────────────────────────────────────────────────────────

const BudgetCard = memo(function BudgetCard({ item, isDeleting, onDelete, onOpen, onSaveTemplate, colors }) {
  const remaining = item.budget - item.total;
  const overBudget = remaining < 0;

  return (
    <View style={[cS.card, { backgroundColor: colors.card }]}>
      <View style={cS.cardHeader}>
        <View style={cS.cardTitleRow}>
          <Text style={[cS.cardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {item.store && item.store !== 'Всички' && (
            <View style={[cS.storeBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="location-outline" size={11} color={colors.primary} />
              <Text style={[cS.storeBadgeText, { color: colors.primary }]}>{item.store}</Text>
            </View>
          )}
        </View>
        <View style={cS.cardActions}>
          <TouchableOpacity onPress={onSaveTemplate} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="copy-outline" size={19} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} disabled={isDeleting} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isDeleting
              ? <ActivityIndicator size="small" color={colors.red} />
              : <Ionicons name="trash-outline" size={19} color={colors.red} />}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[cS.dateText, { color: colors.textQuaternary }]}>{formatDate(item.createdAt)}</Text>

      <View style={cS.chipsRow}>
        {(item.items || []).slice(0, 5).map((p, idx) => (
          <View key={`${item.id}-${idx}`} style={[cS.chip, { backgroundColor: colors.cardAlt }]}>
            <Text style={{ fontSize: 12 }}>{getCategoryEmoji(p.category)}</Text>
            <Text style={[cS.chipText, { color: colors.textSecondary }]} numberOfLines={1}>{p.name}</Text>
            <Text style={[cS.chipQty, { color: colors.textTertiary }]}>×{p.quantity}</Text>
          </View>
        ))}
        {(item.items || []).length > 5 && (
          <View style={[cS.chip, { backgroundColor: colors.border }]}>
            <Text style={[cS.chipMoreText, { color: colors.textSecondary }]}>+{item.items.length - 5}</Text>
          </View>
        )}
      </View>

      <View style={[cS.statsRow, { backgroundColor: colors.cardAlt }, overBudget && { borderColor: colors.red, borderWidth: 1.5, backgroundColor: colors.redLight }]}>
        <View style={cS.stat}>
          <Text style={[cS.statLabel, { color: colors.textTertiary }]}>Бюджет</Text>
          <Text style={[cS.statValue, { color: colors.text }]}>{item.budget?.toFixed(2)} €</Text>
        </View>
        <View style={[cS.statDivider, { backgroundColor: colors.border }]} />
        <View style={cS.stat}>
          <Text style={[cS.statLabel, { color: colors.textTertiary }]}>Общо</Text>
          <Text style={[cS.statValue, { color: colors.text }]}>{item.total?.toFixed(2)} €</Text>
        </View>
        <View style={[cS.statDivider, { backgroundColor: colors.border }]} />
        <View style={cS.stat}>
          <Text style={[cS.statLabel, { color: colors.textTertiary }]}>{overBudget ? 'Над бюджета' : 'Остатък'}</Text>
          <Text style={[cS.statRemaining, { color: overBudget ? colors.red : colors.green }]}>
            {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)} €
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[cS.openBtn, { backgroundColor: colors.primary }]} onPress={onOpen} activeOpacity={0.85}>
        <Text style={cS.openBtnText}>Отвори за пазаруване</Text>
        <Ionicons name="cart-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

const cS = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flex: 1, marginRight: 12, gap: 4 },
  cardName: { fontSize: 17, fontWeight: '700' },
  storeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  storeBadgeText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateText: { fontSize: 12, marginTop: -4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4, maxWidth: 140 },
  chipText: { fontSize: 11, fontWeight: '600', flex: 1 },
  chipQty: { fontSize: 10 },
  chipMoreText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderRadius: 12, paddingVertical: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '600' },
  statRemaining: { fontSize: 15, fontWeight: '700' },
  statDivider: { width: 1, marginVertical: 4 },
  openBtn: { borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedListsScreen({ navigation }) {
  const { lists, loading, error, deleteList } = useBudgetLists();
  const { saveTemplate } = useTemplates();
  const { show: showToast } = useToast();
  const { colors, isDark } = useTheme();
  const [deleting, setDeleting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storeFilter, setStoreFilter] = useState('Всички');

  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const storeOptions = useMemo(() => {
    const stores = new Set(lists.map((l) => l.store).filter(Boolean));
    return ['Всички', ...stores];
  }, [lists]);

  const filtered = useMemo(() =>
    storeFilter === 'Всички' ? lists : lists.filter((l) => l.store === storeFilter),
    [lists, storeFilter]
  );

  const handleRefresh = useCallback(() => {
    Haptics.selectionAsync();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleDelete = useCallback((list) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Изтрий списъка',
      `Сигурни ли сте, че искате да изтриете "${list.name}"?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий', style: 'destructive',
          onPress: async () => {
            setDeleting(list.id);
            try {
              await deleteList(list.id);
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
  }, [deleteList, showToast]);

  const handleOpen = useCallback((list) => {
    Haptics.selectionAsync();
    navigation.navigate('ShoppingList', {
      list: list.items, budget: list.budget,
      listName: list.name, store: list.store || 'Всички', readOnly: true,
    });
  }, [navigation]);

  const handleSaveTemplate = useCallback((list) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Запази като шаблон', `Запази "${list.name}" като шаблон?`, [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Запази',
        onPress: async () => {
          await saveTemplate({ name: list.name, store: list.store, items: list.items });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(`Шаблонът "${list.name}" е запазен`, 'success');
        },
      },
    ]);
  }, [saveTemplate, showToast]);

  const renderItem = useCallback(({ item }) => (
    <BudgetCard
      item={item}
      isDeleting={deleting === item.id}
      onDelete={() => handleDelete(item)}
      onOpen={() => handleOpen(item)}
      onSaveTemplate={() => handleSaveTemplate(item)}
      colors={colors}
    />
  ), [deleting, handleDelete, handleOpen, handleSaveTemplate, colors]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Моите списъци</Text>
          <Text style={s.headerSub}>Зарежда се…</Text>
        </View>
        <View style={{ padding: 16 }}>{[0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)}</View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.border} />
          <Text style={[s.errorText, { color: colors.red }]}>Грешка при зареждане</Text>
          <Text style={[s.errorSub, { color: colors.textTertiary }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Моите списъци</Text>
            <Text style={s.headerSub}>
              {lists.length > 0 ? `${lists.length} запазени` : 'Все още нямате списъци'}
            </Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.joinBtn} onPress={() => navigation.navigate('JoinSharedList')} activeOpacity={0.85} accessibilityLabel="Присъедини се към споделен списък" accessibilityRole="button">
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={s.joinBtnText}>Присъедини</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85} accessibilityLabel="Нов списък" accessibilityRole="button">
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.newBtnText}>Нов</Text>
            </TouchableOpacity>
          </View>
        </View>

        {storeOptions.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {storeOptions.map((st) => (
              <TouchableOpacity
                key={st}
                style={[s.filterChip, storeFilter === st && s.filterChipActive]}
                onPress={() => { Haptics.selectionAsync(); setStoreFilter(st); }}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: storeFilter === st }}
                accessibilityLabel={st}
              >
                <Text style={[s.filterLabel, storeFilter === st && s.filterLabelActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="wallet-outline" size={72} color={colors.border} />
          <Text style={s.emptyTitle}>
            {storeFilter !== 'Всички' ? `Няма списъци за ${storeFilter}` : 'Няма запазени списъци'}
          </Text>
          <Text style={s.emptyDesc}>Създайте нов бюджетен списък и го запазете.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85} accessibilityLabel="Създай нов списък" accessibilityRole="button">
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.emptyBtnText}>Създай списък</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={220}
          ListHeaderComponent={<MonthlySummary lists={lists} colors={colors} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },
    errorText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
    errorSub: { fontSize: 13, textAlign: 'center' },

    header: {
      backgroundColor: c.card, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: c.border, gap: 12,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 2 },
    headerSub: { fontSize: 13, color: c.textTertiary },
    headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    joinBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.primaryLight, paddingHorizontal: 12, paddingVertical: 9,
      borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
    },
    joinBtnText: { color: c.primary, fontWeight: '600', fontSize: 13 },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
    newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    filterRow: { gap: 8, paddingRight: 4 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: c.cardAlt, borderWidth: 1.5, borderColor: c.border },
    filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    filterLabelActive: { color: '#fff' },

    list: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 14 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 19, fontWeight: '700', color: c.text, marginBottom: 8, marginTop: 16, textAlign: 'center' },
    emptyDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    emptyBtn: {
      backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
