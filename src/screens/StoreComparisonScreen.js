import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AnimatedPressable from '../components/AnimatedPressable';
import { getCategoryEmoji } from './HomeScreen';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const PRESET_STORES = ['Lidl', 'Kaufland', 'Billa', 'OMV', 'Fantastico'];

export default function StoreComparisonScreen({ navigation }) {
  const [stores, setStores] = useState(['Lidl', 'Kaufland']);
  const [newStore, setNewStore] = useState('');
  const [items, setItems] = useState([]);

  // Add item form
  const [itemName, setItemName] = useState('');
  const [prices, setPrices] = useState({});

  // Computed totals per store
  const storeTotals = useMemo(() => {
    return stores.map((store) => {
      const total = items.reduce((sum, item) => {
        const p = parseFloat(item.prices[store]);
        return sum + (isNaN(p) ? 0 : p);
      }, 0);
      const missingCount = items.filter((item) => !item.prices[store] || isNaN(parseFloat(item.prices[store]))).length;
      return { store, total, missingCount };
    }).sort((a, b) => {
      if (a.missingCount > 0 && b.missingCount === 0) return 1;
      if (b.missingCount > 0 && a.missingCount === 0) return -1;
      return a.total - b.total;
    });
  }, [stores, items]);

  const cheapestStore = storeTotals.find((s) => s.missingCount === 0)?.store;

  const addStore = () => {
    const name = newStore.trim();
    if (!name || stores.includes(name)) return;
    setStores((prev) => [...prev, name]);
    setNewStore('');
  };

  const removeStore = (store) => {
    if (stores.length <= 2) {
      Alert.alert('Минимум 2 магазина', 'Трябват поне 2 магазина за сравнение.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStores((prev) => prev.filter((s) => s !== store));
  };

  const addItem = () => {
    const name = itemName.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const itemPrices = {};
    stores.forEach((s) => { itemPrices[s] = prices[s] || ''; });
    setItems((prev) => [...prev, { id: uid(), name, prices: itemPrices }]);
    setItemName('');
    setPrices({});
  };

  const updatePrice = useCallback((itemId, store, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, prices: { ...item.prices, [store]: value } } : item
      )
    );
  }, []);

  const removeItem = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleShopAt = (store) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const listItems = items.map((item) => ({
      id: uid(),
      name: item.name,
      price: parseFloat(item.prices[store]) || 0,
      quantity: 1,
      subtotal: parseFloat(item.prices[store]) || 0,
      category: 'other',
      note: '',
    }));
    navigation.navigate('Home', { preloadedItems: listItems, preloadedStore: store });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Сравни магазини</Text>
            <Text style={styles.subtitle}>Виж къде е по-изгодно</Text>
          </View>
        </View>

        {/* Store selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Магазини за сравнение</Text>
          <View style={styles.storeChips}>
            {stores.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.storeChip}
                onLongPress={() => removeStore(s)}
                activeOpacity={0.8}
              >
                <Text style={styles.storeChipText}>{s}</Text>
                <TouchableOpacity onPress={() => removeStore(s)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close" size={14} color="#9B96D4" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <View style={styles.addStoreRow}>
              <TextInput
                style={styles.addStoreInput}
                placeholder="+ Добави"
                placeholderTextColor="#bbb"
                value={newStore}
                onChangeText={setNewStore}
                onSubmitEditing={addStore}
                returnKeyType="done"
              />
            </View>
          </View>
          {/* Preset quick-adds */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
            {PRESET_STORES.filter((s) => !stores.includes(s)).map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.presetChip}
                onPress={() => setStores((prev) => [...prev, s])}
              >
                <Ionicons name="add" size={13} color="#6C63FF" />
                <Text style={styles.presetChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add item form */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Добави продукт</Text>
          <View style={styles.addCard}>
            <View style={styles.addNameRow}>
              <Ionicons name="cart-outline" size={18} color="#aaa" />
              <TextInput
                style={styles.addNameInput}
                placeholder="Наименование на продукта"
                placeholderTextColor="#bbb"
                value={itemName}
                onChangeText={setItemName}
                returnKeyType="next"
              />
            </View>
            <View style={styles.priceColumns}>
              {stores.map((s) => (
                <View key={s} style={styles.priceCol}>
                  <Text style={styles.priceColLabel} numberOfLines={1}>{s}</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.pricePre}>€</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="—"
                      placeholderTextColor="#ccc"
                      value={prices[s] || ''}
                      onChangeText={(v) => setPrices((prev) => ({ ...prev, [s]: v }))}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              ))}
            </View>
            <AnimatedPressable style={styles.addBtn} onPress={addItem}>
              <Ionicons name="add-circle" size={17} color="#fff" />
              <Text style={styles.addBtnText}>Добави продукт</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Items table */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{items.length} продукта</Text>
            <View style={styles.table}>
              {/* Header row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCell, styles.tableHeaderCell, styles.itemNameCell]}>Продукт</Text>
                {stores.map((s) => (
                  <Text key={s} style={[styles.tableCell, styles.tableHeaderCell, styles.priceCell]} numberOfLines={1}>{s}</Text>
                ))}
                <View style={{ width: 24 }} />
              </View>
              {/* Data rows */}
              {items.map((item, idx) => (
                <View key={item.id} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, styles.itemNameCell]} numberOfLines={2}>{item.name}</Text>
                  {stores.map((s) => {
                    const val = item.prices[s];
                    const num = parseFloat(val);
                    const allPrices = stores.map((st) => parseFloat(item.prices[st])).filter((n) => !isNaN(n));
                    const isCheapest = !isNaN(num) && allPrices.length > 1 && num === Math.min(...allPrices);
                    return (
                      <View key={s} style={[styles.tableCell, styles.priceCell]}>
                        <TextInput
                          style={[styles.tablePriceInput, isCheapest && styles.tablePriceInputCheapest]}
                          value={val || ''}
                          onChangeText={(v) => updatePrice(item.id, s, v)}
                          keyboardType="decimal-pad"
                          placeholder="—"
                          placeholderTextColor="#ccc"
                        />
                        {isCheapest && <Ionicons name="arrow-down" size={10} color="#2ecc71" />}
                      </View>
                    );
                  })}
                  <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Резултат</Text>
            {storeTotals.map((st, idx) => {
              const isBest = st.store === cheapestStore;
              return (
                <View key={st.store} style={[styles.resultCard, isBest && styles.resultCardBest]}>
                  <View style={styles.resultLeft}>
                    <View style={styles.resultRank}>
                      <Text style={[styles.resultRankText, isBest && styles.resultRankTextBest]}>#{idx + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.resultStore}>{st.store}</Text>
                      {st.missingCount > 0 && (
                        <Text style={styles.resultMissing}>{st.missingCount} продукта без цена</Text>
                      )}
                    </View>
                    {isBest && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>⭐ Най-изгодно</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.resultRight}>
                    <Text style={[styles.resultTotal, isBest && styles.resultTotalBest]}>
                      {st.total.toFixed(2)} €
                    </Text>
                    {isBest && (
                      <AnimatedPressable style={styles.shopBtn} onPress={() => handleShopAt(st.store)}>
                        <Text style={styles.shopBtnText}>Пазарувай тук</Text>
                      </AnimatedPressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { padding: 20, paddingBottom: 48 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, marginTop: 4 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },

  section: { marginBottom: 22 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  storeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#E0DCFF',
  },
  storeChipText: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
  addStoreRow: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#eee', minWidth: 90,
  },
  addStoreInput: { fontSize: 14, color: '#1A1A2E', paddingVertical: 7 },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#eee',
  },
  presetChipText: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },

  addCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  addNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addNameInput: { flex: 1, fontSize: 15, color: '#1A1A2E', paddingVertical: 10 },
  priceColumns: { flexDirection: 'row', gap: 10 },
  priceCol: { flex: 1, gap: 4 },
  priceColLabel: { fontSize: 11, fontWeight: '700', color: '#999', textAlign: 'center' },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F7F8FC', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  pricePre: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  priceInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  table: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F7F8FC', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCell: { paddingHorizontal: 4 },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: '#999' },
  itemNameCell: { flex: 1.8, fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  priceCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  tablePriceInput: {
    flex: 1, fontSize: 13, fontWeight: '700', color: '#1A1A2E',
    textAlign: 'center', paddingVertical: 4,
  },
  tablePriceInputCheapest: { color: '#2ecc71' },

  resultCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  resultCardBest: { borderColor: '#6C63FF', backgroundColor: '#F0EEFF' },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  resultRank: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#F7F8FC',
    justifyContent: 'center', alignItems: 'center',
  },
  resultRankText: { fontSize: 14, fontWeight: '800', color: '#aaa' },
  resultRankTextBest: { color: '#6C63FF' },
  resultStore: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  resultMissing: { fontSize: 11, color: '#e74c3c', marginTop: 2 },
  bestBadge: {
    backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  bestBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  resultRight: { alignItems: 'flex-end', gap: 6 },
  resultTotal: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  resultTotalBest: { color: '#6C63FF' },
  shopBtn: {
    backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
