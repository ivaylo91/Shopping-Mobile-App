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
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useTemplates } from '../hooks/useTemplates';
import { useCustomStores } from '../hooks/useCustomStores';
import { useRecurringItems } from '../hooks/useRecurringItems';
import { usePriceHistory } from '../hooks/usePriceHistory';
import { useFavoriteStores } from '../hooks/useFavoriteStores';
import { useNotificationPermission } from '../hooks/useNotifications';
import AnimatedPressable from '../components/AnimatedPressable';

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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation, route }) {
  const { logout, user } = useAuth();
  const { show: showToast } = useToast();
  const { lists, saveList } = useBudgetLists();
  const { templates, saveTemplate, deleteTemplate } = useTemplates();
  const { stores, customs, addStore, removeStore } = useCustomStores();
  const { recurring, addRecurring, removeRecurring, isRecurring } = useRecurringItems();
  const { getPriceInfo } = usePriceHistory();
  const { isFavorite, toggleFavorite, sortStores } = useFavoriteStores();
  useNotificationPermission();

  // List fields
  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState('');
  const [store, setStore] = useState('Всички');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Add-item form
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCategory, setItemCategory] = useState('other');
  const [itemNote, setItemNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modals
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);

  // Handle incoming scanned product / preloaded items from other screens
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

  // Sorted stores with favorites first
  const sortedStores = useMemo(() => sortStores(stores), [stores, isFavorite]);

  // Product history suggestions
  const suggestions = useMemo(() => {
    const map = {};
    lists.forEach((list) => {
      (list.items || []).forEach((item) => {
        const key = item.name.toLowerCase();
        if (!map[key]) {
          map[key] = { name: item.name, price: item.price, category: item.category || 'other', count: 0 };
        }
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

  // ─── Item operations ─────────────────────────────────────────────────────────

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

  // ─── Save / shop ──────────────────────────────────────────────────────────────

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
    Alert.prompt('Запази като шаблон', 'Въведете наименование:', async (name) => {
      if (!name?.trim()) return;
      await saveTemplate({ name: name.trim(), store, items });
      showToast(`Шаблонът "${name.trim()}" е запазен`, 'success');
    }, 'plain-text', listName || '');
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

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Здравей, {user?.email?.split('@')[0]} 👋</Text>
            <Text style={styles.title}>Нов бюджетен{'\n'}списък</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('StoreComparison')}>
              <Ionicons name="stats-chart-outline" size={18} color="#6C63FF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); logout(); }}>
              <Ionicons name="log-out-outline" size={16} color="#666" />
              <Text style={styles.logoutText}>Изход</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recurring items */}
        {recurring.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>🔁 Постоянни продукти</Text>
              <TouchableOpacity onPress={addAllRecurring}>
                <Text style={styles.sectionLink}>+ Добави всички</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {recurring.map((r) => {
                const alreadyAdded = items.some((i) => i.name.toLowerCase() === r.name.toLowerCase());
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.recurringChip, alreadyAdded && styles.recurringChipDone]}
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
                    <Text style={styles.recurringEmoji}>{getCategoryEmoji(r.category)}</Text>
                    <View>
                      <Text style={[styles.recurringName, alreadyAdded && styles.recurringNameDone]} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.recurringPrice}>{r.price.toFixed(2)} €</Text>
                    </View>
                    {alreadyAdded && <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Templates */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Шаблони</Text>
              <TouchableOpacity onPress={() => setTemplatesModalVisible(true)}>
                <Text style={styles.sectionLink}>Всички ({templates.length})</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {templates.slice(0, 5).map((tpl) => (
                <TouchableOpacity key={tpl.id} style={styles.tplChip} onPress={() => loadTemplate(tpl)}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Изтрий шаблон', `Изтрий "${tpl.name}"?`, [{ text: 'Отказ', style: 'cancel' }, { text: 'Изтрий', style: 'destructive', onPress: () => deleteTemplate(tpl.id) }]); }}
                  activeOpacity={0.8}>
                  <Ionicons name="copy-outline" size={13} color="#6C63FF" />
                  <Text style={styles.tplChipText} numberOfLines={1}>{tpl.name}</Text>
                  <Text style={styles.tplChipCount}>{tpl.items.length} прод.</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* List name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Наименование</Text>
          <View style={styles.inputCard}>
            <Ionicons name="list-outline" size={20} color="#aaa" />
            <TextInput style={styles.nameInput} placeholder="напр. Седмично пазаруване"
              placeholderTextColor="#bbb" value={listName} onChangeText={setListName} returnKeyType="next" />
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Бюджет</Text>
          <View style={styles.inputCard}>
            <Text style={styles.currencySymbol}>€</Text>
            <TextInput style={styles.budgetInput} placeholder="0.00" placeholderTextColor="#bbb"
              value={budget} onChangeText={setBudget} keyboardType="decimal-pad" returnKeyType="done" />
          </View>
        </View>

        {/* Store */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Магазин</Text>
            <TouchableOpacity onPress={() => setStoreModalVisible(true)}>
              <Text style={styles.sectionLink}>+ Управление</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeRow}>
            {sortedStores.map((s) => {
              const fav = isFavorite(s);
              return (
                <TouchableOpacity key={s} style={[styles.storeChip, store === s && styles.storeChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setStore(s); }}
                  onLongPress={() => { toggleFavorite(s); showToast(fav ? `"${s}" е премахнат от любими` : `"${s}" е добавен в любими`, 'info'); }}
                  activeOpacity={0.8}>
                  {fav && <Ionicons name="star" size={11} color={store === s ? '#FFD700' : '#6C63FF'} />}
                  <Text style={[styles.storeLabel, store === s && styles.storeLabelActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Add Product */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Добави продукт</Text>
          <View style={styles.addCard}>
            <View style={styles.addRow}>
              <View style={[styles.inputCard, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="cart-outline" size={18} color="#aaa" />
                <TextInput style={styles.addNameInput} placeholder="Продукт" placeholderTextColor="#bbb"
                  value={itemName} onChangeText={(v) => { setItemName(v); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)} returnKeyType="next" />
                {itemName.length > 0 && (
                  <TouchableOpacity onPress={() => { setItemName(''); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={16} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('BarcodeScanner')}>
                <Ionicons name="barcode-outline" size={22} color="#6C63FF" />
              </TouchableOpacity>
              <View style={[styles.inputCard, { width: 100 }]}>
                <Text style={styles.pricePre}>€</Text>
                <TextInput style={styles.priceInput} placeholder="0.00" placeholderTextColor="#bbb"
                  value={itemPrice} onChangeText={setItemPrice} keyboardType="decimal-pad"
                  returnKeyType="done" onFocus={() => setShowSuggestions(false)} />
              </View>
            </View>

            {/* Autocomplete */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {filteredSuggestions.map((s) => {
                  const info = getPriceInfo(s.name);
                  return (
                    <TouchableOpacity key={s.name} style={styles.suggestionRow} onPress={() => applySuggestion(s)} activeOpacity={0.7}>
                      <Text style={styles.suggestionEmoji}>{getCategoryEmoji(s.category)}</Text>
                      <Text style={styles.suggestionName}>{s.name}</Text>
                      <Text style={styles.suggestionPrice}>{s.price.toFixed(2)} €</Text>
                      {info && (
                        <Text style={[styles.trendBadge, { color: TREND_COLOR[info.trend] }]}>
                          {TREND_ICON[info.trend]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Category */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.catChip, itemCategory === cat.id && styles.catChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setItemCategory(cat.id); }} activeOpacity={0.8}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, itemCategory === cat.id && styles.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Qty + note + add */}
            <View style={styles.addFooter}>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => Math.max(1, q - 1)); }}>
                  <Ionicons name="remove" size={16} color="#6C63FF" />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{itemQty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => q + 1); }}>
                  <Ionicons name="add" size={16} color="#6C63FF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.noteToggle} onPress={() => { Haptics.selectionAsync(); setShowNote((v) => !v); }}>
                <Ionicons name={showNote ? 'chatbubble' : 'chatbubble-outline'} size={14} color={showNote ? '#6C63FF' : '#aaa'} />
                <Text style={[styles.noteToggleText, showNote && { color: '#6C63FF' }]}>Бележка</Text>
              </TouchableOpacity>
              <AnimatedPressable style={styles.addBtn} onPress={addItem}>
                <Ionicons name="add-circle" size={17} color="#fff" />
                <Text style={styles.addBtnText}>Добави</Text>
              </AnimatedPressable>
            </View>

            {showNote && (
              <View style={styles.noteInputWrap}>
                <Ionicons name="pencil-outline" size={14} color="#aaa" />
                <TextInput style={styles.noteInput} placeholder="напр. само ако е намалено"
                  placeholderTextColor="#ccc" value={itemNote} onChangeText={setItemNote}
                  returnKeyType="done" multiline />
              </View>
            )}
          </View>
        </View>

        {/* Items list */}
        {items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>{items.length} продукта</Text>
              <TouchableOpacity onPress={handleSaveTemplate}>
                <Text style={styles.sectionLink}>💾 Запази като шаблон</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemsList}>
              {items.map((item, idx) => {
                const info = getPriceInfo(item.name);
                return (
                  <View key={item.id} style={[styles.itemRow, idx < items.length - 1 && styles.itemRowBorder]}>
                    <View style={styles.itemIconWrap}>
                      <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        {info && (
                          <Text style={[styles.trendBadge, { color: TREND_COLOR[info.trend] }]}>
                            {TREND_ICON[info.trend]} {info.trend === 'down' ? 'Намалено' : info.trend === 'up' ? 'Поскъпнало' : ''}
                          </Text>
                        )}
                      </View>
                      {item.note ? <Text style={styles.itemNote} numberOfLines={1}>📝 {item.note}</Text> : null}
                      <Text style={styles.itemMeta}>{item.price.toFixed(2)} € × {item.quantity}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemSubtotal}>{item.subtotal.toFixed(2)} €</Text>
                      <View style={styles.itemQtyControls}>
                        <TouchableOpacity onPress={() => changeQty(item.id, -1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="remove-circle-outline" size={19} color="#aaa" />
                        </TouchableOpacity>
                        <Text style={styles.itemQtyNum}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => changeQty(item.id, 1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="add-circle-outline" size={19} color="#aaa" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Recurring toggle */}
                    <TouchableOpacity onPress={() => toggleItemRecurring(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={isRecurring(item.name) ? 'repeat' : 'repeat-outline'} size={18} color={isRecurring(item.name) ? '#6C63FF' : '#ccc'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={21} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Budget summary */}
        {items.length > 0 && (
          <View style={[styles.summaryCard, remaining < 0 && styles.summaryCardOver]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Обща сума</Text>
              <Text style={styles.summaryValue}>{total.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Бюджет</Text>
              <Text style={styles.summaryValue}>{budgetNum.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{remaining >= 0 ? 'Оставащо' : 'Над бюджета'}</Text>
              <Text style={[styles.summaryRemaining, { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
                {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)} €
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <AnimatedPressable style={[styles.shopBtn, items.length === 0 && styles.btnDisabled]}
            onPress={handleStartShopping} disabled={items.length === 0}>
            <Ionicons name="cart-outline" size={18} color="#6C63FF" />
            <Text style={styles.shopBtnText}>Пазарувай</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Запази</Text></>}
          </AnimatedPressable>
        </View>

      </ScrollView>

      {/* Store modal */}
      <Modal visible={storeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Управление на магазини</Text>
            <Text style={styles.modalSub}>Задръжте за ⭐ любими · Дълго натискане = изтриване</Text>
            <View style={styles.storeAddRow}>
              <TextInput style={styles.storeAddInput} placeholder="Нов магазин..." placeholderTextColor="#bbb"
                value={newStoreName} onChangeText={setNewStoreName} returnKeyType="done" onSubmitEditing={handleAddStore} />
              <TouchableOpacity style={styles.storeAddBtn} onPress={handleAddStore}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
              {sortedStores.map((s) => (
                <View key={s} style={styles.storeManageRow}>
                  <TouchableOpacity onPress={() => toggleFavorite(s)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name={isFavorite(s) ? 'star' : 'star-outline'} size={18} color={isFavorite(s) ? '#FFD700' : '#ccc'} />
                  </TouchableOpacity>
                  <Text style={styles.storeManageName}>{s}</Text>
                  {customs.includes(s) && (
                    <TouchableOpacity onPress={() => { removeStore(s); if (store === s) setStore('Всички'); }}>
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setStoreModalVisible(false)}>
              <Text style={styles.modalCloseText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Templates modal */}
      <Modal visible={templatesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Шаблони</Text>
            <Text style={styles.modalSub}>Натиснете за зареждане · Задръжте за изтриване</Text>
            <FlatList data={templates} keyExtractor={(t) => t.id} style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 10 }}
              renderItem={({ item: tpl }) => (
                <TouchableOpacity style={styles.tplCard} onPress={() => loadTemplate(tpl)}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Изтрий шаблон', `Изтрий "${tpl.name}"?`, [{ text: 'Отказ', style: 'cancel' }, { text: 'Изтрий', style: 'destructive', onPress: () => deleteTemplate(tpl.id) }]); }}
                  activeOpacity={0.8}>
                  <View style={styles.tplCardHeader}>
                    <Text style={styles.tplCardName}>{tpl.name}</Text>
                    {tpl.store && tpl.store !== 'Всички' && (
                      <View style={styles.tplStoreBadge}><Text style={styles.tplStoreBadgeText}>{tpl.store}</Text></View>
                    )}
                  </View>
                  <Text style={styles.tplCardItems}>
                    {tpl.items.map((i) => `${getCategoryEmoji(i.category)} ${i.name}`).slice(0, 4).join('  ')}
                    {tpl.items.length > 4 ? `  +${tpl.items.length - 4}` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setTemplatesModalVisible(false)}>
              <Text style={styles.modalCloseText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 48 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, marginTop: 6 },
  greeting: { fontSize: 13, color: '#999', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', lineHeight: 34 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#666', fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, textTransform: 'uppercase' },
  sectionLink: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },

  recurringChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, padding: 10,
    borderWidth: 1.5, borderColor: '#eee', minWidth: 110,
  },
  recurringChipDone: { borderColor: '#2ecc71', backgroundColor: '#F0FFF4' },
  recurringEmoji: { fontSize: 20 },
  recurringName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', maxWidth: 100 },
  recurringNameDone: { color: '#2ecc71' },
  recurringPrice: { fontSize: 11, color: '#aaa', marginTop: 1 },

  tplChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E0DCFF' },
  tplChipText: { fontSize: 13, fontWeight: '700', color: '#6C63FF', maxWidth: 110 },
  tplChipCount: { fontSize: 11, color: '#9B96D4' },

  inputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  nameInput: { flex: 1, fontSize: 16, color: '#1A1A2E', paddingVertical: 14 },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: '#6C63FF' },
  budgetInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#1A1A2E', paddingVertical: 12 },

  storeRow: { gap: 8, paddingRight: 4 },
  storeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: '#eee' },
  storeChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  storeLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  storeLabelActive: { color: '#fff' },

  addCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addNameInput: { flex: 1, fontSize: 15, color: '#1A1A2E', paddingVertical: 12 },
  cameraBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  pricePre: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1A1A2E', paddingVertical: 12 },

  suggestionsBox: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0EEFF', overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F7F8FC', gap: 8 },
  suggestionEmoji: { fontSize: 16 },
  suggestionName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  suggestionPrice: { fontSize: 13, fontWeight: '700', color: '#6C63FF' },
  trendBadge: { fontSize: 11, fontWeight: '700' },

  catRow: { gap: 8, paddingRight: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F7F8FC', borderWidth: 1.5, borderColor: '#eee' },
  catChipActive: { backgroundColor: '#F0EEFF', borderColor: '#6C63FF' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#888' },
  catLabelActive: { color: '#6C63FF' },

  addFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', minWidth: 20, textAlign: 'center' },
  noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  noteToggleText: { fontSize: 12, fontWeight: '600', color: '#aaa' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6C63FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noteInputWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F7F8FC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  noteInput: { flex: 1, fontSize: 13, color: '#555', paddingTop: 0 },

  itemsList: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F7F8FC' },
  itemIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  itemNote: { fontSize: 11, color: '#aaa', marginBottom: 1 },
  itemMeta: { fontSize: 12, color: '#bbb' },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemSubtotal: { fontSize: 14, fontWeight: '800', color: '#6C63FF' },
  itemQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemQtyNum: { fontSize: 13, fontWeight: '700', color: '#555', minWidth: 16, textAlign: 'center' },
  deleteBtn: { padding: 2 },

  summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 22, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
  summaryCardOver: { borderColor: '#e74c3c' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  summaryRemaining: { fontSize: 22, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },

  actionRow: { flexDirection: 'row', gap: 12 },
  shopBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0EEFF', borderRadius: 18, paddingVertical: 18, borderWidth: 2, borderColor: '#6C63FF' },
  shopBtnText: { color: '#6C63FF', fontWeight: '800', fontSize: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6C63FF', borderRadius: 18, paddingVertical: 18, shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.45, shadowOpacity: 0 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 16 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A2E' },
  modalSub: { fontSize: 13, color: '#aaa', marginTop: -10 },
  storeAddRow: { flexDirection: 'row', gap: 10 },
  storeAddInput: { flex: 1, backgroundColor: '#F7F8FC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A2E' },
  storeAddBtn: { backgroundColor: '#6C63FF', borderRadius: 12, width: 46, height: 46, justifyContent: 'center', alignItems: 'center' },
  storeManageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F7F8FC' },
  storeManageName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  modalClose: { backgroundColor: '#F7F8FC', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCloseText: { fontSize: 15, fontWeight: '700', color: '#555' },
  tplCard: { backgroundColor: '#F7F8FC', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#eee', gap: 6 },
  tplCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tplCardName: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  tplStoreBadge: { backgroundColor: '#F0EEFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tplStoreBadgeText: { fontSize: 11, fontWeight: '700', color: '#6C63FF' },
  tplCardItems: { fontSize: 12, color: '#888', lineHeight: 18 },
});
