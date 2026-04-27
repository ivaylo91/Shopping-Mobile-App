import { useState, useMemo, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AnimatedPressable from '../components/AnimatedPressable';
import { useTheme } from '../context/ThemeContext';
import { uid } from '../utils/uid';
import { getCategoryEmoji } from './HomeScreen';

const PRESET_STORES = ['Lidl', 'Kaufland', 'Billa', 'OMV', 'Fantastico'];

export default function StoreComparisonScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [stores, setStores] = useState(['Lidl', 'Kaufland']);
  const [newStore, setNewStore] = useState('');
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [prices, setPrices] = useState({});

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

  const cheapestStore = storeTotals.find((st) => st.missingCount === 0)?.store;

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
    stores.forEach((st) => { itemPrices[st] = prices[st] || ''; });
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
      id: uid(), name: item.name,
      price: parseFloat(item.prices[store]) || 0,
      quantity: 1,
      subtotal: parseFloat(item.prices[store]) || 0,
      category: 'other', note: '',
    }));
    navigation.navigate('Home', { preloadedItems: listItems, preloadedStore: store });
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }} accessibilityLabel="Назад" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Сравни магазини</Text>
            <Text style={s.subtitle}>Виж къде е по-изгодно</Text>
          </View>
        </View>

        {/* Store selector */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Магазини за сравнение</Text>
          <View style={s.storeChips}>
            {stores.map((st) => (
              <TouchableOpacity key={st} style={s.storeChip} onLongPress={() => removeStore(st)} activeOpacity={0.8} accessibilityLabel={st} accessibilityRole="button">
                <Text style={s.storeChipText}>{st}</Text>
                <TouchableOpacity onPress={() => removeStore(st)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityLabel={`Премахни ${st}`} accessibilityRole="button">
                  <Ionicons name="close" size={14} color={colors.primaryMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <View style={s.addStoreRow}>
              <TextInput
                style={s.addStoreInput}
                placeholder="+ Добави"
                placeholderTextColor={colors.textQuaternary}
                value={newStore}
                onChangeText={setNewStore}
                onSubmitEditing={addStore}
                returnKeyType="done"
                keyboardAppearance={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
            {PRESET_STORES.filter((st) => !stores.includes(st)).map((st) => (
              <TouchableOpacity key={st} style={s.presetChip} onPress={() => setStores((prev) => [...prev, st])} accessibilityLabel={`Добави ${st}`} accessibilityRole="button">
                <Ionicons name="add" size={13} color={colors.primary} />
                <Text style={s.presetChipText}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add item form */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Добави продукт</Text>
          <View style={s.addCard}>
            <View style={s.addNameRow}>
              <Ionicons name="cart-outline" size={18} color={colors.textQuaternary} />
              <TextInput
                style={s.addNameInput}
                placeholder="Наименование на продукта"
                placeholderTextColor={colors.textQuaternary}
                value={itemName}
                onChangeText={setItemName}
                returnKeyType="next"
                keyboardAppearance={isDark ? 'dark' : 'light'}
              />
            </View>
            <View style={s.priceColumns}>
              {stores.map((st) => (
                <View key={st} style={s.priceCol}>
                  <Text style={s.priceColLabel} numberOfLines={1}>{st}</Text>
                  <View style={s.priceInputWrap}>
                    <Text style={s.pricePre}>€</Text>
                    <TextInput
                      style={s.priceInput}
                      placeholder="—"
                      placeholderTextColor={colors.textQuaternary}
                      value={prices[st] || ''}
                      onChangeText={(v) => setPrices((prev) => ({ ...prev, [st]: v }))}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                  </View>
                </View>
              ))}
            </View>
            <AnimatedPressable style={s.addBtn} onPress={addItem}>
              <Ionicons name="add-circle" size={17} color="#fff" />
              <Text style={s.addBtnText}>Добави продукт</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Items table */}
        {items.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{items.length} продукта</Text>
            <View style={s.table}>
              <View style={[s.tableHeaderRow, { backgroundColor: colors.cardAlt }]}>
                <Text style={[s.tableCell, s.tableHeaderCell, s.itemNameCell]}>Продукт</Text>
                {stores.map((st) => (
                  <Text key={st} style={[s.tableCell, s.tableHeaderCell, s.priceCell]} numberOfLines={1}>{st}</Text>
                ))}
                <View style={{ width: 24 }} />
              </View>
              {items.map((item, idx) => (
                <View key={item.id} style={[s.tableRow, idx % 2 === 0 && { backgroundColor: colors.cardAlt }]}>
                  <Text style={[s.tableCell, s.itemNameCell, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                  {stores.map((st) => {
                    const val = item.prices[st];
                    const num = parseFloat(val);
                    const allPrices = stores.map((s2) => parseFloat(item.prices[s2])).filter((n) => !isNaN(n));
                    const isCheapest = !isNaN(num) && allPrices.length > 1 && num === Math.min(...allPrices);
                    return (
                      <View key={st} style={[s.tableCell, s.priceCell]}>
                        <TextInput
                          style={[s.tablePriceInput, { color: isCheapest ? colors.green : colors.text }]}
                          value={val || ''}
                          onChangeText={(v) => updatePrice(item.id, st, v)}
                          keyboardType="decimal-pad"
                          placeholder="—"
                          placeholderTextColor={colors.textQuaternary}
                          keyboardAppearance={isDark ? 'dark' : 'light'}
                        />
                        {isCheapest && <Ionicons name="arrow-down" size={10} color={colors.green} />}
                      </View>
                    );
                  })}
                  <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={`Премахни ${item.name}`} accessibilityRole="button">
                    <Ionicons name="close-circle" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {items.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Резултат</Text>
            {storeTotals.map((st, idx) => {
              const isBest = st.store === cheapestStore;
              return (
                <View key={st.store} style={[s.resultCard, isBest && s.resultCardBest]}>
                  <View style={s.resultLeft}>
                    <View style={[s.resultRank, { backgroundColor: colors.cardAlt }]}>
                      <Text style={[s.resultRankText, { color: isBest ? colors.primary : colors.textTertiary }]}>#{idx + 1}</Text>
                    </View>
                    <View>
                      <Text style={[s.resultStore, { color: colors.text }]}>{st.store}</Text>
                      {st.missingCount > 0 && (
                        <Text style={[s.resultMissing, { color: colors.red }]}>{st.missingCount} продукта без цена</Text>
                      )}
                    </View>
                    {isBest && (
                      <View style={[s.bestBadge, { backgroundColor: colors.primary }]}>
                        <Text style={s.bestBadgeText}>⭐ Най-изгодно</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.resultRight}>
                    <Text style={[s.resultTotal, { color: isBest ? colors.primary : colors.text }]}>
                      {st.total.toFixed(2)} €
                    </Text>
                    {isBest && (
                      <AnimatedPressable style={[s.shopBtn, { backgroundColor: colors.primary }]} onPress={() => handleShopAt(st.store)}>
                        <Text style={s.shopBtnText}>Пазарувай тук</Text>
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

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 48 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, marginTop: 4 },
    title: { fontSize: 20, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 13, color: c.textTertiary, marginTop: 2 },

    section: { marginBottom: 22 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

    storeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    storeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: isDark ? c.border : '#E0DCFF' },
    storeChipText: { fontSize: 14, fontWeight: '700', color: c.primary },
    addStoreRow: { backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1.5, borderColor: c.border, minWidth: 90 },
    addStoreInput: { fontSize: 14, color: c.text, paddingVertical: 7 },
    presetChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: c.border },
    presetChipText: { fontSize: 13, color: c.primary, fontWeight: '600' },

    addCard: { backgroundColor: c.card, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
    addNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addNameInput: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 10 },
    priceColumns: { flexDirection: 'row', gap: 10 },
    priceCol: { flex: 1, gap: 4 },
    priceColLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, textAlign: 'center' },
    priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.cardAlt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    pricePre: { fontSize: 12, fontWeight: '700', color: c.primary },
    priceInput: { flex: 1, fontSize: 15, fontWeight: '700', color: c.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 12 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    table: { backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
    tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
    tableCell: { paddingHorizontal: 4 },
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: c.textTertiary },
    itemNameCell: { flex: 1.8, fontSize: 13, fontWeight: '600' },
    priceCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
    tablePriceInput: { flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },

    resultCard: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 6, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
    resultCardBest: { borderColor: c.primary, backgroundColor: c.primaryLight },
    resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    resultRank: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    resultRankText: { fontSize: 14, fontWeight: '700' },
    resultStore: { fontSize: 16, fontWeight: '700' },
    resultMissing: { fontSize: 11, marginTop: 2 },
    bestBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    bestBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    resultRight: { alignItems: 'flex-end', gap: 6 },
    resultTotal: { fontSize: 20, fontWeight: '700' },
    shopBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
    shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  });
}
