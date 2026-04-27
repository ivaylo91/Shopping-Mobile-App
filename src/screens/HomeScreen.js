import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import Text from '../components/Text';
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
import { getShadows } from '../theme';
import { useLayout } from '../hooks/useLayout';

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

export const CATEGORY_COLORS = {
  food:      { bg: '#FEF3E2', text: '#92520F', darkBg: '#2A1C08', darkText: '#D4913A' },
  dairy:     { bg: '#E3F4FD', text: '#1B6CA8', darkBg: '#071928', darkText: '#5BA3D4' },
  meat:      { bg: '#FCEAE8', text: '#A83030', darkBg: '#2A0808', darkText: '#D06060' },
  veggies:   { bg: '#E8F5E9', text: '#2E7434', darkBg: '#0A2A0C', darkText: '#5CB860' },
  fruit:     { bg: '#FDE8F0', text: '#9C1A57', darkBg: '#2A0818', darkText: '#D460A0' },
  drinks:    { bg: '#E3EFF8', text: '#1556A0', darkBg: '#08182A', darkText: '#5090D4' },
  household: { bg: '#ECEFF1', text: '#455A64', darkBg: '#161A1C', darkText: '#8EA8B4' },
  personal:  { bg: '#F3E5F5', text: '#6A1B9A', darkBg: '#1A0A2A', darkText: '#B06AD4' },
  other:     { bg: '#F1F1EE', text: '#5A5A54', darkBg: '#1A1A14', darkText: '#9E9E96' },
};

export function getCategoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '📦';
}

export function getCategoryColors(id, isDark) {
  const c = CATEGORY_COLORS[id] ?? CATEGORY_COLORS.other;
  return { bg: isDark ? c.darkBg : c.bg, text: isDark ? c.darkText : c.text };
}

const TREND_ICON = { up: '↑', down: '↓', same: '→', new: '★' };
const STAR_COLOR = '#FFD700';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation, route }) {
  const { logout } = useAuth();
  const { show: showToast } = useToast();
  const { colors, isDark, toggleTheme } = useTheme();
  const { isTablet } = useLayout();
  const { saveList } = useBudgetLists();
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
  const [shopping, setShopping] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCategory, setItemCategory] = useState('other');
  const [itemNote, setItemNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [storeSheetVisible, setStoreSheetVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [libraryVisible, setLibraryVisible] = useState(false);
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
  const overBudget = budgetNum > 0 && total > budgetNum;

  // ─── Budget bar animation ─────────────────────────────────────────────────────
  const [barTrackWidth, setBarTrackWidth] = useState(0);
  const barProgress = useSharedValue(0);
  useEffect(() => {
    barProgress.value = withTiming(
      Math.min(budgetNum > 0 ? total / budgetNum : 0, 1),
      { duration: 600, easing: Easing.out(Easing.quart) }
    );
  }, [total, budgetNum]);
  const barAnimStyle = useAnimatedStyle(() => ({ width: barProgress.value * barTrackWidth }));

  const sortedStores = useMemo(() => sortStores(stores), [stores, sortStores]);

  const suggestions = useMemo(() => {
    const map = {};
    templates.forEach((tpl) => {
      (tpl.items || []).forEach((item) => {
        const key = item.name.toLowerCase();
        if (!map[key]) map[key] = { name: item.name, price: item.price, category: item.category || 'other', count: 0 };
        map[key].count++;
        map[key].price = item.price;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [templates]);

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

  const addRecurringItem = useCallback((r) => {
    if (items.some((i) => i.name.toLowerCase() === r.name.toLowerCase())) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, {
      id: uid(), name: r.name, price: r.price, quantity: r.quantity,
      subtotal: r.price * r.quantity, category: r.category, note: r.note || '',
    }]);
  }, [items]);

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

  const persistList = async () => {
    const name = listName.trim() || 'Моят списък';
    await saveList({ name, budget: budgetNum, store, items });
  };

  const handleStartShopping = async () => {
    if (items.length === 0) { showToast('Добавете поне един продукт', 'warning'); return; }
    if (budgetNum <= 0) { showToast('Въведете бюджет', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShopping(true);
    try {
      await persistList();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('ShoppingList', {
        list: items, budget: budgetNum,
        listName: listName.trim() || 'Моят списък', store,
      });
      setListName(''); setBudget(''); setStore('Всички'); setItems([]);
    } catch (err) {
      showToast(err?.message || 'Неуспешно запазване', 'error');
    } finally {
      setShopping(false);
    }
  };

  const handleSaveTemplate = () => {
    if (items.length === 0) { showToast('Добавете продукти преди да запазите шаблон', 'warning'); return; }
    setSaveTemplateName(listName || '');
    setOverflowVisible(false);
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
    setLibraryVisible(false);
    showToast(`Шаблонът "${tpl.name}" е зареден`, 'info');
  };

  const handleAddStore = async () => {
    const ok = await addStore(newStoreName);
    if (ok) { setNewStoreName(''); showToast('Магазинът е добавен', 'success'); }
    else showToast('Магазинът вече съществува', 'warning');
  };

  // ─── Dynamic styles + theme-aware trend colors ───────────────────────────────

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);
  const trendColor = useMemo(
    () => ({ up: colors.red, down: colors.green, same: colors.textTertiary, new: colors.primary }),
    [colors],
  );
  const hasLibrary = recurring.length > 0 || templates.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.container} contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Нов списък</Text>
          <TouchableOpacity style={s.overflowBtn} onPress={() => setOverflowVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Меню" accessibilityRole="button">
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Setup row: name + budget + store */}
        <View style={s.setupCard}>
          <View style={s.setupTop}>
            <TextInput
              style={s.setupName}
              placeholder="Наименование"
              placeholderTextColor={colors.textQuaternary}
              value={listName}
              onChangeText={setListName}
              returnKeyType="next"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Наименование на списъка"
            />
            <View style={s.setupBudget}>
              <Text style={s.setupCurrency}>€</Text>
              <TextInput
                style={s.setupBudgetInput}
                placeholder="0"
                placeholderTextColor={colors.textQuaternary}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                returnKeyType="done"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Бюджет в евро"
              />
            </View>
          </View>
          <View style={s.setupBottom}>
            <TouchableOpacity style={s.storePill} onPress={() => setStoreSheetVisible(true)} activeOpacity={0.75} accessibilityLabel={`Магазин: ${store}`} accessibilityRole="button">
              <Ionicons name="location-outline" size={13} color={colors.primary} />
              <Text style={s.storePillText} numberOfLines={1}>{store}</Text>
              <Ionicons name="chevron-down" size={13} color={colors.textTertiary} />
            </TouchableOpacity>
            {hasLibrary && (
              <TouchableOpacity style={s.libraryPill} onPress={() => setLibraryVisible(true)} activeOpacity={0.75} accessibilityLabel="Библиотека с продукти" accessibilityRole="button">
                <Ionicons name="library-outline" size={13} color={colors.primary} />
                <Text style={s.libraryPillText}>
                  {recurring.length > 0 && templates.length > 0
                    ? `${recurring.length} постоянни · ${templates.length} шаблона`
                    : recurring.length > 0
                      ? `${recurring.length} постоянни`
                      : `${templates.length} шаблона`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Add Product */}
        <View style={s.addCard}>
          <View style={s.addRow}>
            <View style={s.addNameWrap}>
              <Ionicons name="cart-outline" size={18} color={colors.textQuaternary} />
              <TextInput style={s.addNameInput} placeholder="Продукт" placeholderTextColor={colors.textQuaternary}
                value={itemName} onChangeText={(v) => { setItemName(v); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)} returnKeyType="next"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Наименование на продукта" />
              {itemName.length > 0 && (
                <TouchableOpacity onPress={() => { setItemName(''); setShowSuggestions(false); }} accessibilityLabel="Изчисти" accessibilityRole="button">
                  <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={s.cameraBtn} onPress={() => navigation.navigate('BarcodeScanner')} accessibilityLabel="Сканирай баркод" accessibilityRole="button">
              <Ionicons name="barcode-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <View style={s.addPriceWrap}>
              <Text style={s.pricePre}>€</Text>
              <TextInput style={s.priceInput} placeholder="0.00" placeholderTextColor={colors.textQuaternary}
                value={itemPrice} onChangeText={setItemPrice} keyboardType="decimal-pad"
                returnKeyType="done" onFocus={() => setShowSuggestions(false)}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Цена на продукта" />
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
                      <Text style={[s.trendBadge, { color: trendColor[info.trend] }]}>
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
            {CATEGORIES.map((cat) => {
              const catColors = getCategoryColors(cat.id, isDark);
              const active = itemCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, active && { backgroundColor: catColors.bg }]}
                  onPress={() => { Haptics.selectionAsync(); setItemCategory(cat.id); }}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.label}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, active && { color: catColors.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Qty + note + add */}
          <View style={s.addFooter}>
            <View style={s.qtyRow}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => Math.max(1, q - 1)); }} accessibilityLabel="Намали количеството" accessibilityRole="button">
                <Ionicons name="remove" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={s.qtyValue}>{itemQty}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => { Haptics.selectionAsync(); setItemQty((q) => q + 1); }} accessibilityLabel="Увеличи количеството" accessibilityRole="button">
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.noteToggle} onPress={() => { Haptics.selectionAsync(); setShowNote((v) => !v); }} accessibilityLabel="Бележка" accessibilityRole="button" accessibilityState={{ selected: showNote }}>
              <Ionicons name={showNote ? 'chatbubble' : 'chatbubble-outline'} size={14} color={showNote ? colors.primary : colors.textQuaternary} />
              <Text style={[s.noteToggleText, showNote && { color: colors.primary }]}>Бележка</Text>
            </TouchableOpacity>
            <AnimatedPressable style={s.addBtn} onPress={addItem} accessibilityLabel="Добави продукт">
              <Ionicons name="add-circle" size={17} color="#fff" />
              <Text style={s.addBtnText}>Добави</Text>
            </AnimatedPressable>
          </View>

          {showNote && (
            <View style={s.noteInputWrap}>
              <Ionicons name="pencil-outline" size={14} color={colors.textQuaternary} />
              <TextInput style={s.noteInput} placeholder="напр. само ако е намалено"
                placeholderTextColor={colors.textQuaternary} value={itemNote} onChangeText={setItemNote}
                returnKeyType="done" multiline keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Бележка към продукта" />
            </View>
          )}
        </View>

        {/* Items list */}
        {items.length > 0 && (
          <View style={s.itemsWrap}>
            <Text style={s.itemsLabel}>{items.length} продукта</Text>
            <View style={s.itemsList}>
              {items.map((item, idx) => {
                const info = getPriceInfo(item.name);
                return (
                  <Animated.View key={item.id} entering={FadeInDown.duration(250).delay(Math.min(idx * 30, 120))} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                    <View style={[s.itemIconWrap, { backgroundColor: getCategoryColors(item.category, isDark).bg }]}>
                      <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
                    </View>
                    <View style={s.itemInfo}>
                      <View style={s.itemNameRow}>
                        <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                        {info && (
                          <Text style={[s.trendBadge, { color: trendColor[info.trend] }]}>
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
                        <TouchableOpacity onPress={() => changeQty(item.id, -1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Намали количеството" accessibilityRole="button">
                          <Ionicons name="remove-circle-outline" size={19} color={colors.textQuaternary} />
                        </TouchableOpacity>
                        <Text style={s.itemQtyNum}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => changeQty(item.id, 1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Увеличи количеството" accessibilityRole="button">
                          <Ionicons name="add-circle-outline" size={19} color={colors.textQuaternary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => toggleItemRecurring(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={isRecurring(item.name) ? 'Премахни от постоянни' : 'Добави в постоянни'}>
                      <Ionicons name={isRecurring(item.name) ? 'repeat' : 'repeat-outline'} size={18} color={isRecurring(item.name) ? colors.primary : colors.borderLight} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 2 }} onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`Премахни ${item.name}`}>
                      <Ionicons name="close-circle" size={21} color={colors.red} />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {/* Budget summary — the single progress surface */}
        {items.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={[s.summaryCard, overBudget && s.summaryCardOver]}>
            <View style={s.summaryTop}>
              <Text style={s.summaryTotal}>{total.toFixed(2)} €</Text>
              <Text style={s.summaryOf}>от {budgetNum.toFixed(2)} €</Text>
            </View>
            <View
              style={[s.summaryBarTrack, { backgroundColor: colors.borderLight }]}
              onLayout={e => setBarTrackWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View style={[
                s.summaryBarFill,
                { backgroundColor: overBudget ? colors.red : total / Math.max(budgetNum, 1) > 0.8 ? colors.orange : colors.green },
                barAnimStyle,
              ]} />
            </View>
            <Text style={[s.summaryDelta, { color: overBudget ? colors.red : colors.green }]}>
              {overBudget ? `Над бюджета с ${Math.abs(remaining).toFixed(2)} €` : `Остават ${remaining.toFixed(2)} €`}
            </Text>
          </Animated.View>
        )}

        {/* Primary CTA — single action */}
        <AnimatedPressable
          style={[s.primaryCta, (items.length === 0 || shopping) && s.primaryCtaDisabled]}
          onPress={handleStartShopping}
          disabled={items.length === 0 || shopping}
          accessibilityLabel="Пазарувай"
          accessibilityState={{ disabled: items.length === 0 || shopping }}
        >
          {shopping
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={s.primaryCtaText}>Пазарувай</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>}
        </AnimatedPressable>

      </ScrollView>

      {/* Overflow menu */}
      <Modal visible={overflowVisible} animationType="fade" transparent onRequestClose={() => setOverflowVisible(false)}>
        <TouchableOpacity style={s.overflowBackdrop} activeOpacity={1} onPress={() => setOverflowVisible(false)}>
          <View style={s.overflowMenu}>
            <OverflowItem icon="stats-chart-outline" label="Сравнение по магазини"
              onPress={() => { setOverflowVisible(false); navigation.navigate('StoreComparison'); }} s={s} colors={colors} />
            <OverflowItem icon={isDark ? 'sunny-outline' : 'moon-outline'} label={isDark ? 'Светла тема' : 'Тъмна тема'}
              onPress={() => { toggleTheme(); }} s={s} colors={colors} />
            {items.length > 0 && (
              <OverflowItem icon="bookmark-outline" label="Запази като шаблон"
                onPress={handleSaveTemplate} s={s} colors={colors} />
            )}
            <OverflowItem icon="log-out-outline" label="Изход" danger
              onPress={() => { setOverflowVisible(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); logout(); }} s={s} colors={colors} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Store picker sheet */}
      <Modal visible={storeSheetVisible} animationType="slide" transparent onRequestClose={() => setStoreSheetVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Магазин</Text>
            <View style={s.storeAddRow}>
              <TextInput style={s.storeAddInput} placeholder="Добави магазин..." placeholderTextColor={colors.textQuaternary}
                value={newStoreName} onChangeText={setNewStoreName} returnKeyType="done"
                onSubmitEditing={handleAddStore} keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Нов магазин" />
              <TouchableOpacity style={s.storeAddBtn} onPress={handleAddStore} accessibilityLabel="Добави магазин" accessibilityRole="button">
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 4 }}>
              {sortedStores.map((st) => {
                const fav = isFavorite(st);
                const selected = store === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[s.storeListRow, selected && s.storeListRowActive]}
                    onPress={() => { Haptics.selectionAsync(); setStore(st); setStoreSheetVisible(false); }}
                    activeOpacity={0.75}
                  >
                    <TouchableOpacity onPress={() => toggleFavorite(st)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={fav ? `Премахни ${st} от любими` : `Добави ${st} в любими`}>
                      <Ionicons name={fav ? 'star' : 'star-outline'} size={18} color={fav ? STAR_COLOR : colors.borderLight} />
                    </TouchableOpacity>
                    <Text style={[s.storeListName, selected && s.storeListNameActive]}>{st}</Text>
                    {selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    {customs.includes(st) && !selected && (
                      <TouchableOpacity
                        onPress={() => { removeStore(st); if (store === st) setStore('Всички'); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Изтрий ${st}`}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.red} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Library sheet: Recurring + Templates */}
      <Modal visible={libraryVisible} animationType="slide" transparent onRequestClose={() => setLibraryVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Библиотека</Text>

            {recurring.length > 0 && (
              <View style={{ gap: 10 }}>
                <View style={s.libSectionRow}>
                  <Text style={s.libSectionLabel}>Постоянни продукти</Text>
                  <TouchableOpacity onPress={() => { setLibraryVisible(false); addAllRecurring(); }} accessibilityRole="button" accessibilityLabel="Добави всички постоянни продукти">
                    <Text style={s.libSectionLink}>+ Добави всички</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.libChipsWrap}>
                  {recurring.map((r) => {
                    const alreadyAdded = items.some((i) => i.name.toLowerCase() === r.name.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[s.libChip, alreadyAdded && s.libChipDone]}
                        onPress={() => { addRecurringItem(r); setLibraryVisible(false); }}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          removeRecurring(r.name);
                          showToast(`"${r.name}" е премахнат`, 'info');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 14 }}>{getCategoryEmoji(r.category)}</Text>
                        <Text style={[s.libChipName, alreadyAdded && s.libChipNameDone]} numberOfLines={1}>{r.name}</Text>
                        {alreadyAdded && <Ionicons name="checkmark" size={12} color={colors.green} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {templates.length > 0 && (
              <View style={{ gap: 10, marginTop: recurring.length > 0 ? 8 : 0 }}>
                <Text style={s.libSectionLabel}>Шаблони</Text>
                <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 8 }}>
                  {templates.map((tpl) => (
                    <TouchableOpacity key={tpl.id} style={s.tplCard} onPress={() => loadTemplate(tpl)}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        Alert.alert('Изтрий шаблон', `Изтрий "${tpl.name}"?`, [
                          { text: 'Отказ', style: 'cancel' },
                          { text: 'Изтрий', style: 'destructive', onPress: () => deleteTemplate(tpl.id) },
                        ]);
                      }}
                      activeOpacity={0.8}>
                      <View style={s.tplCardHeader}>
                        <Text style={s.tplCardName} numberOfLines={1}>{tpl.name}</Text>
                        {tpl.store && tpl.store !== 'Всички' && (
                          <View style={s.tplStoreBadge}><Text style={s.tplStoreBadgeText}>{tpl.store}</Text></View>
                        )}
                      </View>
                      <Text style={s.tplCardItems} numberOfLines={1}>
                        {tpl.items.map((i) => `${getCategoryEmoji(i.category)} ${i.name}`).slice(0, 4).join('  ')}
                        {tpl.items.length > 4 ? `  +${tpl.items.length - 4}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Save-as-template */}
      <Modal visible={saveTemplateVisible} animationType="fade" transparent onRequestClose={() => setSaveTemplateVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={[s.sheet, { paddingBottom: 24 }]}>
            <Text style={s.sheetTitle}>Запази като шаблон</Text>
            <TextInput
              style={s.templateNameInput}
              placeholder="Наименование"
              placeholderTextColor={colors.textQuaternary}
              value={saveTemplateName}
              onChangeText={setSaveTemplateName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmSaveTemplate}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Наименование на шаблона"
            />
            <View style={s.templateModalBtns}>
              <TouchableOpacity style={s.templateCancelBtn} onPress={() => setSaveTemplateVisible(false)} accessibilityRole="button" accessibilityLabel="Отказ">
                <Text style={s.templateCancelText}>Отказ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.templateConfirmBtn} onPress={confirmSaveTemplate} accessibilityRole="button" accessibilityLabel="Запази шаблона">
                <Text style={s.templateConfirmText}>Запази</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Overflow menu row ────────────────────────────────────────────────────────

function OverflowItem({ icon, label, onPress, danger, s, colors }) {
  return (
    <TouchableOpacity style={s.overflowItem} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={danger ? colors.red : colors.textSecondary} />
      <Text style={[s.overflowItemText, danger && { color: colors.red }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function makeStyles(c, isDark, isTablet) {
  const sh = getShadows(isDark);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40, maxWidth: isTablet ? 720 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
    title: { fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
    overflowBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.cardAlt, justifyContent: 'center', alignItems: 'center' },

    setupCard: {
      backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 14, gap: 12,
      ...sh.sm,
    },
    setupTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    setupName: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text, paddingVertical: 4 },
    setupBudget: { flexDirection: 'row', alignItems: 'center', gap: 4, borderLeftWidth: 1, borderLeftColor: c.borderLight, paddingLeft: 12 },
    setupCurrency: { fontSize: 16, fontWeight: '500', color: c.textTertiary },
    setupBudgetInput: { fontSize: 20, fontWeight: '600', color: c.text, minWidth: 60, textAlign: 'right', paddingVertical: 2 },
    setupBottom: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    storePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.cardAlt, paddingHorizontal: 12, paddingVertical: 10,
      borderRadius: 20, maxWidth: 180,
    },
    storePillText: { fontSize: 13, fontWeight: '600', color: c.text, maxWidth: 120 },
    libraryPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.primaryLight, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20,
    },
    libraryPillText: { fontSize: 12, fontWeight: '600', color: c.primary },

    addCard: {
      backgroundColor: c.card, borderRadius: 16, padding: 14, gap: 12, marginBottom: 14,
      ...sh.sm,
    },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addNameWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.cardAlt, borderRadius: 12, paddingHorizontal: 12,
    },
    addNameInput: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 12 },
    cameraBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
    addPriceWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.cardAlt, borderRadius: 12, paddingHorizontal: 10, width: 96,
    },
    pricePre: { fontSize: 14, fontWeight: '400', color: c.textTertiary },
    priceInput: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text, paddingVertical: 12 },

    suggestionsBox: { backgroundColor: c.cardAlt, borderRadius: 12, overflow: 'hidden' },
    suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderLight, gap: 8 },
    suggestionName: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    suggestionPrice: { fontSize: 13, fontWeight: '600', color: c.primary },
    trendBadge: { fontSize: 11, fontWeight: '700' },

    catRow: { gap: 6, paddingRight: 4 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 20, backgroundColor: c.cardAlt },
    catLabel: { fontSize: 12, fontWeight: '600', color: c.textTertiary },

    addFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.cardAlt, justifyContent: 'center', alignItems: 'center' },
    qtyValue: { fontSize: 16, fontWeight: '600', color: c.text, minWidth: 20, textAlign: 'center' },
    noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    noteToggleText: { fontSize: 12, fontWeight: '600', color: c.textQuaternary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    noteInputWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: c.cardAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    noteInput: { flex: 1, fontSize: 13, color: c.text, paddingTop: 0 },

    itemsWrap: { marginBottom: 14, gap: 8 },
    itemsLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
    itemsList: { backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', ...sh.sm },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
    itemRowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
    itemIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    itemName: { fontSize: 14, fontWeight: '700', color: c.text },
    itemNote: { fontSize: 11, color: c.textTertiary, marginBottom: 1 },
    itemMeta: { fontSize: 12, color: c.textQuaternary },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    itemSubtotal: { fontSize: 14, fontWeight: '600', color: c.primary },
    itemQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    itemQtyNum: { fontSize: 13, fontWeight: '500', color: c.textSecondary, minWidth: 16, textAlign: 'center' },

    summaryCard: {
      backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 14, gap: 10,
      ...sh.sm,
    },
    summaryCardOver: { backgroundColor: c.redLight },
    summaryTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    summaryTotal: { fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
    summaryOf: { fontSize: 14, color: c.textTertiary, fontWeight: '600' },
    summaryBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    summaryBarFill: { height: 6, borderRadius: 3 },
    summaryDelta: { fontSize: 13, fontWeight: '700' },

    primaryCta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary, borderRadius: 16, paddingVertical: 18,
      shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    primaryCtaDisabled: { opacity: 0.4, shadowOpacity: 0 },
    primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 17 },

    overflowBackdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 64, paddingRight: 16 },
    overflowMenu: { backgroundColor: c.card, borderRadius: 14, paddingVertical: 6, minWidth: 220, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
    overflowItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    overflowItemText: { fontSize: 14, fontWeight: '600', color: c.text },

    sheetBackdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32, gap: 14 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: c.text },

    storeAddRow: { flexDirection: 'row', gap: 10 },
    storeAddInput: { flex: 1, backgroundColor: c.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text },
    storeAddBtn: { backgroundColor: c.primary, borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    storeListRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
    storeListRowActive: { backgroundColor: c.primaryLight },
    storeListName: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    storeListNameActive: { color: c.primary, fontWeight: '700' },

    libSectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    libSectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
    libSectionLink: { fontSize: 12, fontWeight: '600', color: c.primary },
    libChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    libChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.cardAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
    libChipDone: { backgroundColor: c.greenLight },
    libChipName: { fontSize: 13, fontWeight: '600', color: c.text, maxWidth: 120 },
    libChipNameDone: { color: c.green },

    tplCard: { backgroundColor: c.cardAlt, borderRadius: 12, padding: 12, gap: 4 },
    tplCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tplCardName: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    tplStoreBadge: { backgroundColor: c.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    tplStoreBadgeText: { fontSize: 10, fontWeight: '600', color: c.primary },
    tplCardItems: { fontSize: 12, color: c.textTertiary, lineHeight: 18 },

    templateNameInput: {
      backgroundColor: c.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
      fontSize: 16, color: c.text, marginTop: 4,
    },
    templateModalBtns: { flexDirection: 'row', gap: 10 },
    templateCancelBtn: { flex: 1, backgroundColor: c.cardAlt, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    templateCancelText: { fontSize: 15, fontWeight: '700', color: c.textSecondary },
    templateConfirmBtn: { flex: 1, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    templateConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
