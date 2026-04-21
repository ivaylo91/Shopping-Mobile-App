import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useTemplates } from '../hooks/useTemplates';
import { useCustomStores } from '../hooks/useCustomStores';
import { useRecurringItems } from '../hooks/useRecurringItems';
import { usePriceHistory } from '../hooks/usePriceHistory';
import { useFavoriteStores } from '../hooks/useFavoriteStores';
import { useNotificationPermission } from '../hooks/useNotifications';
import AnimatedPressable from '../components/AnimatedPressable';
import { uid } from '../utils/uid';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'food',      emoji: '🍞', label: 'Хранителни' },
  { id: 'dairy',     emoji: '🥛', label: 'Млечни' },
  { id: 'meat',      emoji: '🥩', label: 'Месо' },
  { id: 'veggies',   emoji: '🥦', label: 'Зеленчуци' },
  { id: 'fruit',     emoji: '🍎', label: 'Плодове' },
  { id: 'drinks',    emoji: '🍹', label: 'Напитки' },
  { id: 'household', emoji: '🧹', label: 'Домакински' },
  { id: 'personal',  emoji: '🧴', label: 'Хигиена' },
  { id: 'other',     emoji: '📦', label: 'Друго' },
];

export function getCategoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '📦';
}

const TREND_ICON = { up: '↑', down: '↓', same: '→', new: '★' };
const TREND_COLOR = { up: '#e74c3c', down: '#2ecc71', same: '#aaa', new: '#6C63FF' };

// ─── Budget Progress Ring ─────────────────────────────────────────────────────

function BudgetRing({ total, budget, colors }) {
  if (!budget || budget <= 0) return null;
  const pct = Math.min(total / budget, 1);
  const size = 72;
  const strokeW = 6;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isOver = total > budget;
  const ringColor = isOver ? colors.red : pct > 0.8 ? colors.orange : colors.green;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeW, borderColor: colors.border,
      }} />
      {/* Progress arc via rotation trick */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeW,
        borderColor: 'transparent',
        borderTopColor: ringColor,
        borderRightColor: pct >= 0.25 ? ringColor : 'transparent',
        borderBottomColor: pct >= 0.5 ? ringColor : 'transparent',
        borderLeftColor: pct >= 0.75 ? ringColor : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: ringColor }}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={{ fontSize: 9, color: colors.textTertiary, fontWeight: '600' }}>
          {isOver ? 'над' : 'изразх.'}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation, route }) {
  const { logout, user } = useAuth();
  const { show: showToast } = useToast();
  const { colors, isDark, toggleTheme } = useTheme();
  const { lists, saveList } = useBudgetLists();
  const { templates, saveTemplate, deleteTemplate } = useTemplates();
  const { stores, customs, addStore, removeStore } = useCustomStores();
  const { recurring, addRecurring, removeRecurring, isRecurring } = useRecurringItems();
  const { getPriceInfo } = usePriceHistory();
  const { isFavorite, toggleFavorite, sortStores } = useFavoriteStores();
  useNotificationPermission();

  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState('');
  const [store, setStore] = useState('Всички');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCategory, setItemCategory] = useState('other');
  const [itemNote, setItemNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);
  const [saveTemplateVisible, setSaveTemplateVisible] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  useEffect(() => {
    if (route.params?.scannedProduct) {
      const { name, barcode } = route.params.scannedProduct;
      setItemName(name || barcode);
      if (name) setShowSuggestions(false);
      navigation.setParams({ scannedProduct: undefined });
    }
    if (route.params?.preloadedItems) {
      setItems(route.params.preloadedItems.map((i) => ({ ...i, id: uid() })));
      if (route.params.preloadedStore) setStore(route.params.preloadedStore);
      navigation.setParams({ preloadedItems: undefined, preloadedStore: undefined });
    }
  }, [route.params]);

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const budgetNum = parseFloat(budget) || 0;
  const remaining = budgetNum - total;

  const sortedStores = useMemo(() => sortStores(stores), [stores, sortStores]);

  const suggestions = useMemo(() => {
    const map = {};
    lists.forEach((list) => {
      (list.items || []).forEach((item) => {
        const key = item.name.toLowerCase();
        if (!map[key]) map[key] = { name: item.name, price: item.price, category: item.category || 'other', count: 0 };
        map[key].count++;
        map[key].price = item.price;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [lists]);

  const filteredSuggestions = useMemo(() => {
    if (!itemName || itemName.length < 1) return [];
    return suggestions.filter((s) => s.name.toLowerCase().includes(itemName.toLowerCase())).slice(0, 6);
  }, [suggestions, itemName]);

  // ─── Item operations ──────────────────────────────────────────────────────────

  const addItem = useCallback(() => {
    const name = itemName.trim();
    const price = parseFloat(itemPrice);
    if (!name) { showToast('Въведете наименование', 'warning'); return; }
    if (!price || price <= 0) { showToast('Въведете валидна цена', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, {
      id: uid(), name, price, quantity: itemQty,
      subtotal: price * itemQty, category: itemCategory, note: itemNote.trim(),
    }]);
    setItemName(''); setItemPrice(''); setItemQty(1); setItemNote('');
    setShowNote(false); setShowSuggestions(false);
  }, [itemName, itemPrice, itemQty, itemCategory, itemNote, showToast]);

  const removeItem = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const changeQty = useCallback((id, delta) => {
    Haptics.selectionAsync();
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const qty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: qty, subtotal: i.price * qty };
    }));
  }, []);

  const applySuggestion = useCallback((s) => {
    setItemName(s.name);
    setItemPrice(s.price.toString());
    setItemCategory(s.category || 'other');
    setShowSuggestions(false);
  }, []);

  const addAllRecurring = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toAdd = recurring.filter((r) => !items.some((i) => i.name.toLowerCase() === r.name.toLowerCase()));
    if (toAdd.length === 0) { showToast('Всички постоянни продукти вече са добавени', 'info'); return; }
    setItems((prev) => [...prev, ...toAdd.map((r) => ({
      id: uid(), name: r.name, price: r.price, quantity: r.quantity,
      subtotal: r.price * r.quantity, category: r.category, note: r.note || '',
    }))]);
    showToast(`Добавени ${toAdd.length} продукта`, 'success');
  }, [recurring, items, showToast]);

  const toggleItemRecurring = useCallback((item) => {
    if (isRecurring(item.name)) {
      removeRecurring(item.name);
      showToast(`"${item.name}" е премахнат от постоянни`, 'info');
    } else {
      addRecurring(item);
      showToast(`"${item.name}" е добавен в постоянни`, 'success');
    }
    Haptics.selectionAsync();
  }, [isRecurring, addRecurring, removeRecurring, showToast]);

  const handleSave = async () => {
    if (!listName.trim()) { showToast('Въведете наименование', 'warning'); return; }
    if (budgetNum <= 0) { showToast('Въведете бюджет', 'warning'); return; }
    if (items.length === 0) { showToast('Добавете поне един продукт', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await saveList({ name: listName.trim(), budget: budgetNum, store, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Списъкът е запазен!', 'success');
      setListName(''); setBudget(''); setStore('Всички'); setItems([]);
      setTimeout(() => navigation.navigate('SavedLists'), 800);
    } catch (err) {
      showToast(err?.message || 'Неуспешно запазване', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartShopping = () => {
    if (items.length === 0) { showToast('Добавете поне един продукт', 'warning'); return; }
    if (budgetNum <= 0) { showToast('Въведете бюджет', 'warning'); return; }
    Haptics.selectionAsync();
    navigation.navigate('ShoppingList', {
      list: items, budget: budgetNum,
      listName: listName.trim() || 'Моят списък', store,
    });
  };

  const handleSaveTemplate = () => {
    if (items.length === 0) { showToast('Добавете продукти преди да запазите шаблон', 'warning'); return; }
    setSaveTemplateName(listName || '');
    setSaveTemplateVisible(true);
  };

  const confirmSaveTemplate = async () => {
    const name = saveTemplateName.trim();
    if (!name) { showToast('Въведете наименование', 'warning'); return; }
    setSaveTemplateVisible(false);
    await saveTemplate({ name, store, items });
    showToast(`Шаблонът "${name}" е запазен`, 'success');
  };

  const loadTemplate = (tpl) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems(tpl.items.map((i) => ({ ...i, id: uid() })));
    setStore(tpl.store || 'Всички');
    if (!listName) setListName(tpl.name);
    setTemplatesModalVisible(false);
    showToast(`Шаблонът "${tpl.name}" е зареден`, 'info');
  };

  const handleAddStore = async () => {
    const ok = await addStore(newStoreName);
    if (ok) { setNewStoreName(''); showToast('Магазинът е добавен', 'success'); }
    else showToast('Магазинът вече съществува', 'warning');
  };

  // ─── Dynamic styles ──────────────────────────────────────────────────────────

  const s = makeStyles(colors, isDark);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.container} contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Здравей, {user?.email?.split('@')[0]} 👋</Text>
            <Text style={s.title}>Нов бюджетен{'\n'}списък</Text>
          </View>
          <View style={s.headerRight}>
            {/* Budget ring shown when budget + items exist */}
            {budgetNum > 0 && items.length > 0 && (
              <BudgetRing total={total} budget={budgetNum} colors={colors} />
            )}
            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('StoreComparison')}>
                <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={toggleTheme}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.logoutBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); logout(); }}>
                <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
                <Text style={s.logoutText}>Изход</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recurring items */}
        {recurring.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>🔁 Постоянни продукти</Text>
              <TouchableOpacity onPress={addAllRecurring}>
                <Text style={s.sectionLink}>+ Добави всички</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {recurring.map((r) => {
                const alreadyAdded = items.some((i) => i.name.toLowerCase() === r.name.toLowerCase());
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.recurringChip, alreadyAdded && s.recurringChipDone]}
                    onPress={() => {
                      if (alreadyAdded) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setItems((prev) => [...prev, {
                        id: uid(), name: r.name, price: r.price, quantity: r.quantity,
                        subtotal: r.price * r.quantity, category: r.category, note: r.note || '',
                      }]);
                    }}
                    onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeRecurring(r.name); showToast(`"${r.name}" е премахнат`, 'info'); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 18 }}>{getCategoryEmoji(r.category)}</Text>
                    <View>
                      <Text style={[s.recurringName, alreadyAdded && s.recurringNameDone]} numberOfLines={1}>{r.name}</Text>
                      <Text style={s.recurringPrice}>{r.price.toFixed(2)} €</Text>
                    </View>
                    {alreadyAdded && <Ionicons name="checkmark-circle" size={14} color={colors.green} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Templates */}
        {templates.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Шаблони</Text>
              <TouchableOpacity onPress={() => setTemplatesModalVisible(true)}>
                <Text style={s.sectionLink}>Всички ({templates.length})</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {templates.slice(0, 5).map((tpl) => (
                <TouchableOpacity key={tpl.id} style={s.tplChip} onPress={() => loadTemplate(tpl)}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Изтрий шаблон', `Изтрий "${tpl.name}"?`, [{ text: 'Отказ', style: 'cancel' }, { text: 'Изтрий', style: 'destructive', onPress: () => deleteTemplate(tpl.id) }]); }}
                  activeOpacity={0.8}>
                  <Ionicons name="copy-outline" size={13} color={colors.primary} />
                  <Text style={s.tplChipText} numberOfLines={1}>{tpl.name}</Text>
                  <Text style={s.tplChipCount}>{tpl.items.length} прод.</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* List name */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Наименование</Text>
          <View style={s.inputCard}>
            <Ionicons name="list-outline" size={20} color={colors.textQuaternary} />
            <TextInput style={s.nameInput} placeholder="напр. Седмично пазаруване"
              placeholderTextColor={colors.textQuaternary} value={listName} onChangeText={setListName}
              returnKeyType="next" keyboardAppearance={isDark ? 'dark' : 'light'} />
          </View>
        </View>

        {/* Budget */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Бюджет</Text>
          <View style={s.inputCard}>
            <Text style={s.currencySymbol}>€</Text>
            <TextInput style={s.budgetInput} placeholder="0.00" placeholderTextColor={colors.textQuaternary}
              value={budget} onChangeText={setBudget} keyboardType="decimal-pad" returnKeyType="done"
              keyboardAppearance={isDark ? 'dark' : 'light'} />
          </View>
        </View>

        {/* Store */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>Магазин</Text>
            <TouchableOpacity onPress={() => setStoreModalVisible(true)}>
              <Text style={s.sectionLink}>+ Управление</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.storeRow}>
            {sortedStores.map((st) => {
              const fav = isFavorite(st);
              return (
                <TouchableOpacity key={st} style={[s.storeChip, store === st && s.storeChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setStore(st); }}
                  onLongPress={() => { toggleFavorite(st); showToast(fav ? `"${st}" е премахнат от любими` : `"${st}" е добавен в любими`, 'info'); }}
                  activeOpacity={0.8}>
                  {fav && <Ionicons name="star" size={11} color={store === st ? '#FFD700' : colors.primary} />}
                  <Text style={[s.storeLabel, store === st && s.storeLabelActive]}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Add Product */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Добави продукт</Text>
          <View style={s.addCard}>
            <View style={s.addRow}>
              <View style={[s.inputCard, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="cart-outline" size={18} color={colors.textQuaternary} />
                <TextInput style={s.addNameInput} placeholder="Продукт" placeholderTextColor={colors.textQuaternary}
                  value={itemName} onChangeText={(v) => { setItemName(v); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)} returnKeyType="next"
                  keyboardAppearance={isDark ? 'dark' : 'light'} />
                {itemName.length > 0 && (
                  <TouchableOpacity onPress={() => { setItemName(''); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={s.cameraBtn} onPress={() => navigation.navigate('BarcodeScanner')}>
                <Ionicons name="barcode-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <View style={[s.inputCard, { width: 100 }]}>
                <Text style={s.pricePre}>€</Text>
                <TextInput style={s.priceInput} placeholder="0.00" placeholderTextColor={colors.textQuaternary}
                  value={itemPrice} onChangeText={setItemPrice} keyboardType="decimal-pad"
                  returnKeyType="done" onFocus={() => setShowSuggestions(false)}
                  keyboardAppearance={isDark ? 'dark' : 'light'} />
              </View>
            </View>

            {/* Autocomplete */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={s.suggestionsBox}>
                {filteredSuggestions.map((sg) => {
                  const info = getPriceInfo(sg.name);
                  return (
                    <TouchableOpacity key={sg.name} style={s.suggestionRow} onPress={() => applySuggestion(sg)} activeOpacity={0.7}>
                      <Text style={{ fontSize: 16 }}>{getCategoryEmoji(sg.category)}</Text>
                      <Text style={s.suggestionName}>{sg.name}</Text>
                      <Text style={s.suggestionPrice}>{sg.price.toFixed(2)} €</Text>
                      {info && (
                        <Text style={[s.trendBadge, { color: TREND_COLOR[info.trend] }]}>
                          {TREND_ICON[info.trend]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Category */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.id} style={[s.catChip, itemCategory === cat.id && s.catChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setItemCategory(cat.id); }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, itemCategory === cat.id && s.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Qty + note + add */}
            <View style={s.addFooter}>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => Math.max(1, q - 1)); }}>
                  <Ionicons name="remove" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={s.qtyValue}>{itemQty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => q + 1); }}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.noteToggle} onPress={() => { Haptics.selectionAsync(); setShowNote((v) => !v); }}>
                <Ionicons name={showNote ? 'chatbubble' : 'chatbubble-outline'} size={14} color={showNote ? colors.primary : colors.textQuaternary} />
                <Text style={[s.noteToggleText, showNote && { color: colors.primary }]}>Бележка</Text>
              </TouchableOpacity>
              <AnimatedPressable style={s.addBtn} onPress={addItem}>
                <Ionicons name="add-circle" size={17} color="#fff" />
                <Text style={s.addBtnText}>Добави</Text>
              </AnimatedPressable>
            </View>

            {showNote && (
              <View style={s.noteInputWrap}>
                <Ionicons name="pencil-outline" size={14} color={colors.textQuaternary} />
                <TextInput style={s.noteInput} placeholder="напр. само ако е намалено"
                  placeholderTextColor={colors.textQuaternary} value={itemNote} onChangeText={setItemNote}
                  returnKeyType="done" multiline keyboardAppearance={isDark ? 'dark' : 'light'} />
              </View>
            )}
          </View>
        </View>

        {/* Items list */}
        {items.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>{items.length} продукта</Text>
              <TouchableOpacity onPress={handleSaveTemplate}>
                <Text style={s.sectionLink}>💾 Запази като шаблон</Text>
              </TouchableOpacity>
            </View>
            <View style={s.itemsList}>
              {items.map((item, idx) => {
                const info = getPriceInfo(item.name);
                return (
                  <View key={item.id} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                    <View style={s.itemIconWrap}>
                      <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
                    </View>
                    <View style={s.itemInfo}>
                      <View style={s.itemNameRow}>
                        <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                        {info && (
                          <Text style={[s.trendBadge, { color: TREND_COLOR[info.trend] }]}>
                            {TREND_ICON[info.trend]} {info.trend === 'down' ? 'Намалено' : info.trend === 'up' ? 'Поскъпнало' : ''}
                          </Text>
                        )}
                      </View>
                      {item.note ? <Text style={s.itemNote} numberOfLines={1}>📝 {item.note}</Text> : null}
                      <Text style={s.itemMeta}>{item.price.toFixed(2)} € × {item.quantity}</Text>
                    </View>
                    <View style={s.itemRight}>
                      <Text style={s.itemSubtotal}>{item.subtotal.toFixed(2)} €</Text>
                      <View style={s.itemQtyControls}>
                        <TouchableOpacity onPress={() => changeQty(item.id, -1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="remove-circle-outline" size={19} color={colors.textQuaternary} />
                        </TouchableOpacity>
                        <Text style={s.itemQtyNum}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => changeQty(item.id, 1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="add-circle-outline" size={19} color={colors.textQuaternary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => toggleItemRecurring(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={isRecurring(item.name) ? 'repeat' : 'repeat-outline'} size={18} color={isRecurring(item.name) ? colors.primary : colors.borderLight} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 2 }} onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={21} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Budget summary */}
        {items.length > 0 && (
          <View style={[s.summaryCard, remaining < 0 && s.summaryCardOver]}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Обща сума</Text>
              <Text style={s.summaryValue}>{total.toFixed(2)} €</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Бюджет</Text>
              <Text style={s.summaryValue}>{budgetNum.toFixed(2)} €</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{remaining >= 0 ? 'Оставащо' : 'Над бюджета'}</Text>
              <Text style={[s.summaryRemaining, { color: remaining >= 0 ? colors.green : colors.red }]}>
                {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)} €
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={s.actionRow}>
          <AnimatedPressable style={[s.shopBtn, items.length === 0 && s.btnDisabled]}
            onPress={handleStartShopping} disabled={items.length === 0}>
            <Ionicons name="cart-outline" size={18} color={colors.primary} />
            <Text style={s.shopBtnText}>Пазарувай</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[s.saveBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={s.saveBtnText}>Запази</Text></>}
          </AnimatedPressable>
        </View>

      </ScrollView>

      {/* Store modal */}
      <Modal visible={storeModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Управление на магазини</Text>
            <Text style={s.modalSub}>Задръжте за ⭐ любими · Дълго натискане = изтриване</Text>
            <View style={s.storeAddRow}>
              <TextInput style={s.storeAddInput} placeholder="Нов магазин..." placeholderTextColor={colors.textQuaternary}
                value={newStoreName} onChangeText={setNewStoreName} returnKeyType="done"
                onSubmitEditing={handleAddStore} keyboardAppearance={isDark ? 'dark' : 'light'} />
              <TouchableOpacity style={s.storeAddBtn} onPress={handleAddStore}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
              {sortedStores.map((st) => (
                <View key={st} style={s.storeManageRow}>
                  <TouchableOpacity onPress={() => toggleFavorite(st)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name={isFavorite(st) ? 'star' : 'star-outline'} size={18} color={isFavorite(st) ? '#FFD700' : colors.borderLight} />
                  </TouchableOpacity>
                  <Text style={s.storeManageName}>{st}</Text>
                  {customs.includes(st) && (
                    <TouchableOpacity onPress={() => { removeStore(st); if (store === st) setStore('Всички'); }}>
                      <Ionicons name="trash-outline" size={18} color={colors.red} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setStoreModalVisible(false)}>
              <Text style={s.modalCloseText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save-as-template modal */}
      <Modal visible={saveTemplateVisible} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: 20 }]}>
            <Text style={s.modalTitle}>Запази като шаблон</Text>
            <TextInput
              style={s.templateNameInput}
              placeholder="Наименование на шаблона"
              placeholderTextColor={colors.textQuaternary}
              value={saveTemplateName}
              onChangeText={setSaveTemplateName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmSaveTemplate}
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
            <View style={s.templateModalBtns}>
              <TouchableOpacity style={s.templateCancelBtn} onPress={() => setSaveTemplateVisible(false)}>
                <Text style={s.templateCancelText}>Отказ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.templateConfirmBtn} onPress={confirmSaveTemplate}>
                <Text style={s.templateConfirmText}>Запази</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Templates modal */}
      <Modal visible={templatesModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Шаблони</Text>
            <Text style={s.modalSub}>Натиснете за зареждане · Задръжте за изтриване</Text>
            <FlatList data={templates} keyExtractor={(t) => t.id} style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 10 }}
              renderItem={({ item: tpl }) => (
                <TouchableOpacity style={s.tplCard} onPress={() => loadTemplate(tpl)}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Изтрий шаблон', `Изтрий "${tpl.name}"?`, [{ text: 'Отказ', style: 'cancel' }, { text: 'Изтрий', style: 'destructive', onPress: () => deleteTemplate(tpl.id) }]); }}
                  activeOpacity={0.8}>
                  <View style={s.tplCardHeader}>
                    <Text style={s.tplCardName}>{tpl.name}</Text>
                    {tpl.store && tpl.store !== 'Всички' && (
                      <View style={s.tplStoreBadge}><Text style={s.tplStoreBadgeText}>{tpl.store}</Text></View>
                    )}
                  </View>
                  <Text style={s.tplCardItems}>
                    {tpl.items.map((i) => `${getCategoryEmoji(i.category)} ${i.name}`).slice(0, 4).join('  ')}
                    {tpl.items.length > 4 ? `  +${tpl.items.length - 4}` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.modalClose} onPress={() => setTemplatesModalVisible(false)}>
              <Text style={s.modalCloseText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function makeStyles(c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    container: { flex: 1 },
    content: { padding: 22, paddingBottom: 48 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, marginTop: 6 },
    greeting: { fontSize: 13, color: c.textTertiary, marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: c.text, lineHeight: 34 },
    headerRight: { alignItems: 'flex-end', gap: 8 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.cardAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    logoutText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },

    section: { marginBottom: 20 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 1, textTransform: 'uppercase' },
    sectionLink: { fontSize: 12, fontWeight: '700', color: c.primary },

    recurringChip: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.card, borderRadius: 14, padding: 10,
      borderWidth: 1.5, borderColor: c.border, minWidth: 110,
    },
    recurringChipDone: { borderColor: c.green, backgroundColor: c.greenLight },
    recurringName: { fontSize: 13, fontWeight: '700', color: c.text, maxWidth: 100 },
    recurringNameDone: { color: c.green },
    recurringPrice: { fontSize: 11, color: c.textTertiary, marginTop: 1 },

    tplChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: isDark ? c.border : '#E0DCFF' },
    tplChipText: { fontSize: 13, fontWeight: '700', color: c.primary, maxWidth: 110 },
    tplChipCount: { fontSize: 11, color: c.primaryMuted },

    inputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, gap: 10, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 6, elevation: 2 },
    nameInput: { flex: 1, fontSize: 16, color: c.text, paddingVertical: 14 },
    currencySymbol: { fontSize: 18, fontWeight: '700', color: c.primary },
    budgetInput: { flex: 1, fontSize: 28, fontWeight: '700', color: c.text, paddingVertical: 12 },

    storeRow: { gap: 8, paddingRight: 4 },
    storeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: c.card, borderWidth: 2, borderColor: c.border },
    storeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    storeLabel: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    storeLabelActive: { color: '#fff' },

    addCard: { backgroundColor: c.card, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addNameInput: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 12 },
    cameraBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
    pricePre: { fontSize: 14, fontWeight: '700', color: c.primary },
    priceInput: { flex: 1, fontSize: 18, fontWeight: '700', color: c.text, paddingVertical: 12 },

    suggestionsBox: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.primaryLight, overflow: 'hidden' },
    suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderLight, gap: 8 },
    suggestionName: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    suggestionPrice: { fontSize: 13, fontWeight: '700', color: c.primary },
    trendBadge: { fontSize: 11, fontWeight: '700' },

    catRow: { gap: 8, paddingRight: 4 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: c.cardAlt, borderWidth: 1.5, borderColor: c.border },
    catChipActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    catLabel: { fontSize: 12, fontWeight: '600', color: c.textTertiary },
    catLabelActive: { color: c.primary },

    addFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
    qtyValue: { fontSize: 16, fontWeight: '800', color: c.text, minWidth: 20, textAlign: 'center' },
    noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    noteToggleText: { fontSize: 12, fontWeight: '600', color: c.textQuaternary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    noteInputWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: c.cardAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    noteInput: { flex: 1, fontSize: 13, color: c.text, paddingTop: 0 },

    itemsList: { backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
    itemRowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
    itemIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    itemName: { fontSize: 14, fontWeight: '700', color: c.text },
    itemNote: { fontSize: 11, color: c.textTertiary, marginBottom: 1 },
    itemMeta: { fontSize: 12, color: c.textQuaternary },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    itemSubtotal: { fontSize: 14, fontWeight: '800', color: c.primary },
    itemQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    itemQtyNum: { fontSize: 13, fontWeight: '700', color: c.textSecondary, minWidth: 16, textAlign: 'center' },

    summaryCard: { backgroundColor: c.card, borderRadius: 18, padding: 18, marginBottom: 22, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 10, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
    summaryCardOver: { borderColor: c.red },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    summaryLabel: { fontSize: 15, color: c.textSecondary, fontWeight: '600' },
    summaryValue: { fontSize: 16, fontWeight: '700', color: c.text },
    summaryRemaining: { fontSize: 22, fontWeight: '800' },
    summaryDivider: { height: 1, backgroundColor: c.borderLight, marginVertical: 2 },

    actionRow: { flexDirection: 'row', gap: 12 },
    shopBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primaryLight, borderRadius: 18, paddingVertical: 18, borderWidth: 2, borderColor: c.primary },
    shopBtnText: { color: c.primary, fontWeight: '800', fontSize: 16 },
    saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, borderRadius: 18, paddingVertical: 18, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    btnDisabled: { opacity: 0.45, shadowOpacity: 0 },

    modalOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 16 },
    modalTitle: { fontSize: 19, fontWeight: '800', color: c.text },
    modalSub: { fontSize: 13, color: c.textTertiary, marginTop: -10 },
    storeAddRow: { flexDirection: 'row', gap: 10 },
    storeAddInput: { flex: 1, backgroundColor: c.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text },
    storeAddBtn: { backgroundColor: c.primary, borderRadius: 12, width: 46, height: 46, justifyContent: 'center', alignItems: 'center' },
    storeManageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderLight },
    storeManageName: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    modalClose: { backgroundColor: c.cardAlt, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    modalCloseText: { fontSize: 15, fontWeight: '700', color: c.textSecondary },

    tplCard: { backgroundColor: c.cardAlt, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: c.border, gap: 6 },
    tplCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tplCardName: { flex: 1, fontSize: 15, fontWeight: '800', color: c.text },
    tplStoreBadge: { backgroundColor: c.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    tplStoreBadgeText: { fontSize: 11, fontWeight: '700', color: c.primary },
    tplCardItems: { fontSize: 12, color: c.textTertiary, lineHeight: 18 },

    templateNameInput: {
      backgroundColor: c.cardAlt, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: c.text, borderWidth: 1.5, borderColor: isDark ? c.border : '#E0DCFF', marginBottom: 4,
    },
    templateModalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
    templateCancelBtn: { flex: 1, backgroundColor: c.cardAlt, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    templateCancelText: { fontSize: 15, fontWeight: '700', color: c.textSecondary },
    templateConfirmBtn: { flex: 1, backgroundColor: c.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    templateConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
