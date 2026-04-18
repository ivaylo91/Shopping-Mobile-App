import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, memo, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useTemplates } from '../hooks/useTemplates';
import { useToast } from '../context/ToastContext';
import { getCategoryEmoji } from './HomeScreen';
import { OrderCardSkeleton } from '../components/Skeleton';

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '—';
  return timestamp.toDate().toLocaleDateString('bg-BG', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatMonth(timestamp) {
  if (!timestamp?.toDate) return null;
  return timestamp.toDate().toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
}

// ─── Monthly Summary ───────────────────────────────────────────────────────────

function MonthlySummary({ lists }) {
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
    return { count: thisMonth.length, totalSpent, totalBudget, overCount };
  }, [lists]);

  if (stats.count === 0) return null;

  const monthName = lists.find((l) => l.createdAt?.toDate)
    ? formatMonth(lists.find((l) => l.createdAt?.toDate)?.createdAt)
    : null;

  const saved = stats.totalBudget - stats.totalSpent;

  return (
    <View style={msStyles.card}>
      <View style={msStyles.header}>
        <View style={msStyles.iconWrap}><Ionicons name="stats-chart" size={18} color="#6C63FF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={msStyles.title}>Обобщение за месеца</Text>
          {monthName && <Text style={msStyles.month}>{monthName}</Text>}
        </View>
      </View>
      <View style={msStyles.statsRow}>
        <View style={msStyles.stat}>
          <Text style={msStyles.statValue}>{stats.count}</Text>
          <Text style={msStyles.statLabel}>Списъка</Text>
        </View>
        <View style={msStyles.divider} />
        <View style={msStyles.stat}>
          <Text style={msStyles.statValue}>{stats.totalSpent.toFixed(0)} €</Text>
          <Text style={msStyles.statLabel}>Изхарчено</Text>
        </View>
        <View style={msStyles.divider} />
        <View style={msStyles.stat}>
          <Text style={[msStyles.statValue, { color: saved >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            {saved >= 0 ? '+' : ''}{saved.toFixed(0)} €
          </Text>
          <Text style={msStyles.statLabel}>{saved >= 0 ? 'Спестено' : 'Над бюджета'}</Text>
        </View>
        {stats.overCount > 0 && (
          <>
            <View style={msStyles.divider} />
            <View style={msStyles.stat}>
              <Text style={[msStyles.statValue, { color: '#e74c3c' }]}>{stats.overCount}</Text>
              <Text style={msStyles.statLabel}>Превишени</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const msStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16,
    shadowColor: '#6C63FF', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
    borderWidth: 1.5, borderColor: '#F0EEFF', gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  month: { fontSize: 12, color: '#aaa', marginTop: 1, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  divider: { width: 1, height: 28, backgroundColor: '#eee' },
});

// ─── Budget Card ──────────────────────────────────────────────────────────────

const BudgetCard = memo(function BudgetCard({ item, isDeleting, onDelete, onOpen, onSaveTemplate }) {
  const remaining = item.budget - item.total;
  const overBudget = remaining < 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.store && item.store !== 'Всички' && (
            <View style={styles.storeBadge}>
              <Ionicons name="location-outline" size={11} color="#6C63FF" />
              <Text style={styles.storeBadgeText}>{item.store}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onSaveTemplate}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="copy-outline" size={19} color="#6C63FF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            disabled={isDeleting}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color="#e74c3c" />
              : <Ionicons name="trash-outline" size={19} color="#e74c3c" />}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>

      <View style={styles.chipsRow}>
        {(item.items || []).slice(0, 5).map((p, idx) => (
          <View key={`${item.id}-${idx}`} style={styles.chip}>
            <Text style={styles.chipEmoji}>{getCategoryEmoji(p.category)}</Text>
            <Text style={styles.chipText} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.chipQty}>×{p.quantity}</Text>
          </View>
        ))}
        {(item.items || []).length > 5 && (
          <View style={[styles.chip, styles.chipMore]}>
            <Text style={styles.chipMoreText}>+{item.items.length - 5}</Text>
          </View>
        )}
      </View>

      <View style={[styles.statsRow, overBudget && styles.statsRowOver]}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Бюджет</Text>
          <Text style={styles.statValue}>{item.budget?.toFixed(2)} €</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Общо</Text>
          <Text style={styles.statValue}>{item.total?.toFixed(2)} €</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{overBudget ? 'Над бюджета' : 'Остатък'}</Text>
          <Text style={[styles.statRemaining, { color: overBudget ? '#e74c3c' : '#2ecc71' }]}>
            {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)} €
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.openBtn} onPress={onOpen} activeOpacity={0.85}>
        <Text style={styles.openBtnText}>Отвори за пазаруване</Text>
        <Ionicons name="cart-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedListsScreen({ navigation }) {
  const { lists, loading, error, deleteList } = useBudgetLists();
  const { saveTemplate } = useTemplates();
  const { show: showToast } = useToast();
  const [deleting, setDeleting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storeFilter, setStoreFilter] = useState('Всички');

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
              setDeleting(null); }
          },
        },
      ]
    );
  }, [deleteList, showToast]);

  const handleOpen = useCallback((list) => {
    Haptics.selectionAsync();
    navigation.navigate('ShoppingList', {
      list: list.items,
      budget: list.budget,
      listName: list.name,
      store: list.store || 'Всички',
      readOnly: true,
    });
  }, [navigation]);

  const handleSaveTemplate = useCallback((list) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Запази като шаблон',
      `Запази "${list.name}" като шаблон за бъдещи списъци?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Запази',
          onPress: async () => {
            await saveTemplate({ name: list.name, store: list.store, items: list.items });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(`Шаблонът "${list.name}" е запазен`, 'success');
          },
        },
      ]
    );
  }, [saveTemplate, showToast]);

  const renderItem = useCallback(({ item }) => (
    <BudgetCard
      item={item}
      isDeleting={deleting === item.id}
      onDelete={() => handleDelete(item)}
      onOpen={() => handleOpen(item)}
      onSaveTemplate={() => handleSaveTemplate(item)}
    />
  ), [deleting, handleDelete, handleOpen, handleSaveTemplate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Моите списъци</Text>
          <Text style={styles.headerSub}>Зарежда се…</Text>
        </View>
        <View style={{ padding: 16 }}>{[0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)}</View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color="#E0E0EA" />
          <Text style={styles.errorText}>Грешка при зареждане</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Моите списъци</Text>
            <Text style={styles.headerSub}>
              {lists.length > 0 ? `${lists.length} запазени` : 'Все още нямате списъци'}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('JoinSharedList')} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={16} color="#6C63FF" />
              <Text style={styles.joinBtnText}>Присъедини</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.newBtnText}>Нов</Text>
            </TouchableOpacity>
          </View>
        </View>

        {storeOptions.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {storeOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, storeFilter === s && styles.filterChipActive]}
                onPress={() => { Haptics.selectionAsync(); setStoreFilter(s); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterLabel, storeFilter === s && styles.filterLabelActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={72} color="#E0E0EA" />
          <Text style={styles.emptyTitle}>
            {storeFilter !== 'Всички' ? `Няма списъци за ${storeFilter}` : 'Няма запазени списъци'}
          </Text>
          <Text style={styles.emptyDesc}>Създайте нов бюджетен списък и го запазете.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Създай списък</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<MonthlySummary lists={lists} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C63FF" colors={['#6C63FF']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },
  errorText: { fontSize: 16, color: '#e74c3c', fontWeight: '700', marginTop: 12 },
  errorSub: { fontSize: 13, color: '#aaa', textAlign: 'center' },

  header: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee', gap: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#999' },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0EEFF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0DCFF',
  },
  joinBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6C63FF', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F7F8FC', borderWidth: 1.5, borderColor: '#eee',
  },
  filterChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterLabelActive: { color: '#fff' },

  list: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 14, gap: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flex: 1, marginRight: 12, gap: 4 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  storeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: '#F0EEFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  storeBadgeText: { fontSize: 11, color: '#6C63FF', fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateText: { fontSize: 12, color: '#bbb', marginTop: -4 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FC',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4, maxWidth: 140,
  },
  chipEmoji: { fontSize: 12 },
  chipText: { fontSize: 11, fontWeight: '600', color: '#444', flex: 1 },
  chipQty: { fontSize: 10, color: '#aaa' },
  chipMore: { backgroundColor: '#eee' },
  chipMoreText: { fontSize: 11, fontWeight: '700', color: '#888' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#F7F8FC', borderRadius: 12,
    paddingVertical: 10, borderWidth: 1.5, borderColor: 'transparent',
  },
  statsRowOver: { borderColor: '#e74c3c', backgroundColor: '#fff5f5' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  statRemaining: { fontSize: 15, fontWeight: '800' },
  statDivider: { width: 1, backgroundColor: '#e8e8e8', marginVertical: 4 },

  openBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A2E', marginBottom: 8, marginTop: 16, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#6C63FF', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
