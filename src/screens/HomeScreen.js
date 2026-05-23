import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Modal, FlatList, AppState, Share,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, ReduceMotion,
} from 'react-native-reanimated';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBudgetLists } from '../hooks/useBudgetLists';
import { useTemplates } from '../hooks/useTemplates';
import { useCustomStores } from '../hooks/useCustomStores';
import { useRecurringItems } from '../hooks/useRecurringItems';
import { usePriceHistory } from '../hooks/usePriceHistory';
import { useFavoriteStores } from '../hooks/useFavoriteStores';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { uid } from '../utils/uid';
import { getShadows } from '../theme';
import { useLayout } from '../hooks/useLayout';
import {
  CATEGORIES, getCategoryEmoji, getCategoryColors, guessMappedCategory,
} from '../constants/categories';
import { PRODUCT_CATALOG } from '../utils/productCatalog';
import { useSharedList } from '../hooks/useSharedList';
import { checkNearbyAndNotify, scheduleShoppingReminder, cancelShoppingReminders } from '../services/geoNotifications';

// ─── Constants ────────────────────────────────────────────────────────────────

const TREND_ICON = { up: '↑', down: '↓', same: '→', new: '★' };
const STAR_COLOR = '#FFD700';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation, route }) {
  const { logout, user } = useAuth();
  const { show: showToast } = useToast();
  const { colors, isDark, toggleTheme } = useTheme();
  const { isTablet } = useLayout();
  const { saveList } = useBudgetLists();
  const { templates, saveTemplate, deleteTemplate } = useTemplates();
  const { stores, customs, addStore, removeStore } = useCustomStores();
  const { recurring, addRecurring, removeRecurring, isRecurring } = useRecurringItems();
  const { getPriceInfo } = usePriceHistory();
  const { isFavorite, toggleFavorite, sortStores } = useFavoriteStores();
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

  const [lastRemovedItem, setLastRemovedItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [storeSheetVisible, setStoreSheetVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [saveTemplateVisible, setSaveTemplateVisible] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  const [nearbySuggest, setNearbySuggest] = useState(null);

  const [catalogVisible, setCatalogVisible] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogStoreFilter, setCatalogStoreFilter] = useState('Всички');

  const [compareVisible, setCompareVisible] = useState(false);
  const [compareQuery, setCompareQuery] = useState('');

  // ─── Shared list ──────────────────────────────────────────────────────────────
  const { sharedList, shareCode, loading: shareLoading, error: shareError,
    createSharedList, joinSharedList, updateItems: updateSharedItems, disconnect } = useSharedList();
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const appStateRef = useRef(AppState.currentState);

  // Sync items to shared list when items change
  useEffect(() => {
    if (shareCode && items.length > 0) {
      updateSharedItems(shareCode, items, user);
    }
  }, [items, shareCode, updateSharedItems, user]);

  // Sync items FROM shared list into local state (when remote updates arrive)
  useEffect(() => {
    if (sharedList && shareCode) {
      setItems(sharedList.items || []);
    }
  }, [sharedList?.updatedAt]);

  // AppState: when app comes to foreground with items → check nearby stores
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (items.length > 0) {
          await checkNearbyAndNotify(items);
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [items]);

  // Schedule reminder when items are added to list
  useEffect(() => {
    if (items.length > 0) {
      scheduleShoppingReminder(items, listName);
    } else {
      cancelShoppingReminders();
    }
  }, [items.length, listName]);

  useEffect(() => {
    const checkNearby = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const query = `[out:json];node["shop"~"supermarket|convenience|grocery"](around:500,${loc.coords.latitude},${loc.coords.longitude});out;`;
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.elements?.[0]?.tags?.name) {
            setNearbySuggest(data.elements[0].tags.name);
          }
        }
      } catch (e) {}
    };
    checkNearby();
  }, []);

  useEffect(() => {
    if (route.params?.scannedProduct) {
      const { name, barcode, category } = route.params.scannedProduct;
      setItemName(name || barcode || '');
      if (category) {
        setItemCategory(guessMappedCategory(category));
      }
      if (name) setShowSuggestions(false);
      navigation.setParams({ scannedProduct: undefined });
    }
    if (route.params?.preloadedItems) {
      setItems(route.params.preloadedItems.map((i) => ({ ...i, id: uid() })).reverse());
      if (route.params.preloadedStore) setStore(route.params.preloadedStore);
      navigation.setParams({ preloadedItems: undefined, preloadedStore: undefined });
    }
    if (route.params?.addedItem) {
      const newItem = route.params.addedItem;
      if (newItem && newItem.id && newItem.name) {
        setItems((prev) => [newItem, ...prev]);
      }
      navigation.setParams({ addedItem: undefined });
    }
    if (route.params?.selectedStore) {
      setStore(route.params.selectedStore);
      navigation.setParams({ selectedStore: undefined });
    }
    if (route.params?.prefillBudget) {
      setBudget(route.params.prefillBudget);
      if (route.params.prefillStore) setStore(route.params.prefillStore);
      if (route.params.prefillListName) setListName(route.params.prefillListName);
      navigation.setParams({ prefillBudget: undefined, prefillStore: undefined, prefillListName: undefined });
    }
  }, [route.params]);

  const total = useMemo(() => items.reduce((s, i) => s + i.subtotal, 0), [items]);
  const budgetNum = useMemo(() => parseFloat(budget) || 0, [budget]);
  const remaining = useMemo(() => budgetNum - total, [budgetNum, total]);
  const overBudget = useMemo(() => budgetNum > 0 && total > budgetNum, [budgetNum, total]);

  // ─── Budget bar animation ─────────────────────────────────────────────────────
  const barTrackWidth = useSharedValue(0);
  const barProgress = useSharedValue(0);
  useEffect(() => {
    barProgress.value = withTiming(
      Math.min(budgetNum > 0 ? total / budgetNum : 0, 1),
      { duration: 350, easing: Easing.out(Easing.quart), reduceMotion: ReduceMotion.System }
    );
  }, [total, budgetNum]);
  const barAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(1 - barProgress.value) * barTrackWidth.value }],
  }));

  const sortedStores = useMemo(() => sortStores(stores), [stores, sortStores]);

  const CATALOG_STORES = useMemo(
    () => ['Всички', ...new Set(PRODUCT_CATALOG.map((p) => p.store).filter(Boolean))],
    [],
  );

  const STORE_COLORS = {
    Kaufland:   { bg: '#FDECEA', text: '#C0392B' },
    Metro:      { bg: '#E8EEF8', text: '#1A3A6E' },
    Fantastico: { bg: '#E8F5EE', text: '#1A7A44' },
    Lidl:       { bg: '#E8EEF8', text: '#0050AA' },
    Billa:      { bg: '#FFF3E0', text: '#E65100' },
  };

  const compareResults = useMemo(() => {
    const q = compareQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return PRODUCT_CATALOG
      .filter((p) => p.name.toLowerCase().includes(q))
      .sort((a, b) => a.price - b.price)
      .slice(0, 60);
  }, [compareQuery]);

  const filteredCatalog = useMemo(() => {
    let results = PRODUCT_CATALOG;
    if (catalogStoreFilter !== 'Всички') {
      results = results.filter((p) => p.store === catalogStoreFilter);
    }
    if (catalogQuery.trim()) {
      const q = catalogQuery.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }
    return results.slice(0, 200);
  }, [catalogQuery, catalogStoreFilter]);

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
    const query = itemName.toLowerCase();
    const templateMatches = suggestions.filter((s) => s.name.toLowerCase().includes(query));
    if (templateMatches.length >= 6) return templateMatches.slice(0, 6);
    const templateNames = new Set(templateMatches.map((s) => s.name.toLowerCase()));
    const catalogMatches = PRODUCT_CATALOG
      .filter((p) => p.name.toLowerCase().includes(query) && !templateNames.has(p.name.toLowerCase()))
      .slice(0, 6 - templateMatches.length);
    return [...templateMatches, ...catalogMatches];
  }, [suggestions, itemName]);

  // ─── Item operations ──────────────────────────────────────────────────────────

  const addItem = useCallback(() => {
    const name = itemName.trim();
    const priceRaw = itemPrice.toString().replace(',', '.');
    const price = parseFloat(priceRaw);
    
    if (!name) { showToast('Въведете наименование', 'warning'); return; }
    if (isNaN(price) || price <= 0) { showToast('Въведете валидна цена', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingItemId) {
      setItems((prev) => prev.map(i => i.id === editingItemId ? {
        ...i, name, price, quantity: itemQty,
        subtotal: price * itemQty, category: itemCategory, note: itemNote.trim(),
      } : i));
      setEditingItemId(null);
      showToast('Продуктът е обновен', 'success');
    } else {
      setItems((prev) => [{
        id: uid(), name, price, quantity: itemQty,
        subtotal: price * itemQty, category: itemCategory, note: itemNote.trim(),
      }, ...prev]);
    }
    setItemName(''); setItemPrice(''); setItemQty(1); setItemNote('');
    setShowNote(false); setShowSuggestions(false);
  }, [itemName, itemPrice, itemQty, itemCategory, itemNote, showToast, editingItemId]);

  const removeItem = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) setLastRemovedItem(item);
      return prev.filter((i) => i.id !== id);
    });
    showToast('Продуктът е премахнат', 'info');
  }, [showToast]);

  const undoRemove = useCallback(() => {
    if (lastRemovedItem) {
      setItems(prev => [lastRemovedItem, ...prev]);
      setLastRemovedItem(null);
      showToast('Възстановено', 'success');
    }
  }, [lastRemovedItem, showToast]);

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert(
      'Изчистване',
      'Сигурни ли сте, че искате да премахнете всички продукти?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: () => {
            setItems([]);
            showToast('Списъкът е изчистен', 'info');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [items.length, showToast]);

  const startEdit = useCallback((item) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemQty(item.quantity);
    setItemCategory(item.category);
    setItemNote(item.note || '');
    setShowNote(!!item.note);
    // Scroll to top might be needed but let's see
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingItemId(null);
    setItemName(''); setItemPrice(''); setItemQty(1); setItemNote('');
    setShowNote(false);
  }, []);

  const changeQty = useCallback((id, delta) => {
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const qty = Math.max(1, i.quantity + delta);
      if (qty !== i.quantity) Haptics.selectionAsync();
      return { ...i, quantity: qty, subtotal: i.price * qty };
    }));
  }, []);

  const applySuggestion = useCallback((s) => {
    setItemName(s.name);
    setItemPrice(s.price.toString());
    setItemCategory(s.category || 'other');
    setShowSuggestions(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const addFromCatalog = useCallback((product) => {
    const alreadyIn = items.some((i) => i.name.toLowerCase() === product.name.toLowerCase());
    if (alreadyIn) {
      showToast(`"${product.name}" вече е в списъка`, 'info');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => [{
      id: uid(),
      name: product.name,
      price: product.price,
      quantity: 1,
      subtotal: product.price,
      category: product.category || 'other',
      note: '',
    }, ...prev]);
    showToast(`Добавено: ${product.name}`, 'success');
  }, [items, showToast]);

  const openCatalog = useCallback(() => {
    const knownStores = ['Kaufland', 'Metro', 'Fantastico', 'Lidl', 'Billa'];
    setCatalogStoreFilter(knownStores.includes(store) ? store : 'Всички');
    setCatalogQuery('');
    setCatalogVisible(true);
  }, [store]);

  const addRecurringItem = useCallback((r) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.name.toLowerCase() === r.name.toLowerCase());
      if (exists) {
        showToast(`"${r.name}" вече е в списъка`, 'info');
        return prev;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return [{
        id: uid(), name: r.name, price: r.price, quantity: r.quantity,
        subtotal: r.price * r.quantity, category: r.category, note: r.note || '',
      }, ...prev];
    });
  }, []);

  const addAllRecurring = useCallback(() => {
    setItems((prev) => {
      const toAdd = recurring.filter((r) => !prev.some((i) => i.name.toLowerCase() === r.name.toLowerCase()));
      if (toAdd.length === 0) {
        showToast('Всички постоянни продукти вече са добавени', 'info');
        return prev;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(`Добавени ${toAdd.length} продукта`, 'success');
      return [...toAdd.map((r) => ({
        id: uid(), name: r.name, price: r.price, quantity: r.quantity,
        subtotal: r.price * r.quantity, category: r.category, note: r.note || '',
      })), ...prev];
    });
  }, [recurring, showToast]);

  const toggleItemRecurring = useCallback(async (item) => {
    if (isRecurring(item.name)) {
      await removeRecurring(item.name);
      showToast(`"${item.name}" е премахнат от постоянни`, 'info');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await addRecurring(item);
      showToast(`"${item.name}" е добавен в постоянни`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
    showToast(`Шаблонът "${tpl.name}" е зареден`, 'success');
  };

  const handleAddStore = async () => {
    const ok = await addStore(newStoreName);
    if (ok) { setNewStoreName(''); showToast('Магазинът е добавен', 'success'); }
    else showToast('Магазинът вече съществува', 'warning');
  };

  const handleShareList = async () => {
    if (items.length === 0) { showToast('Добавете продукти преди споделяне', 'warning'); return; }
    setOverflowVisible(false);
    try {
      await createSharedList({ name: listName, budget: budgetNum, store, items }, user);
      setShareModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      showToast(e.message || 'Неуспешно споделяне', 'error');
    }
  };

  const handleJoinList = async () => {
    if (!joinCode.trim()) { showToast('Въведете код', 'warning'); return; }
    try {
      const data = await joinSharedList(joinCode, user);
      setItems((data.items || []).map((i) => ({ ...i })));
      if (data.store) setStore(data.store);
      if (data.name) setListName(data.name);
      if (data.budget) setBudget(String(data.budget));
      setJoinModalVisible(false);
      setJoinCode('');
      setShareModalVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Присъединен към споделен списък!', 'success');
    } catch (e) {
      showToast(e.message || 'Кодът е невалиден', 'error');
    }
  };

  const handleDisconnectShared = () => {
    disconnect();
    setShareModalVisible(false);
    showToast('Прекъсна споделянето', 'info');
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {items.length > 0 && (
              <TouchableOpacity style={s.overflowBtn} onPress={clearAll} accessibilityLabel="Изчисти всичко" accessibilityRole="button">
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.overflowBtn} onPress={() => setOverflowVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Меню" accessibilityRole="button">
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
              onSubmitEditing={() => { /* maybe focus price? but next is fine */ }}
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
            <TouchableOpacity style={s.storePill} onPress={() => navigation.navigate('StorePicker')} activeOpacity={0.75} accessibilityLabel={`Магазин: ${store}`} accessibilityRole="button">
              <Ionicons name="location-outline" size={13} color={colors.primary} />
              <Text style={s.storePillText} numberOfLines={1}>{store}</Text>
              <Ionicons name="chevron-down" size={13} color={colors.textTertiary} />
            </TouchableOpacity>
            {nearbySuggest && store === 'Всички' && (
              <TouchableOpacity
                style={[s.storePill, { borderColor: colors.primary, borderWidth: 1 }]}
                onPress={() => { setStore(nearbySuggest); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={[s.storePillText, { color: colors.primary }]}>{nearbySuggest}?</Text>
              </TouchableOpacity>
            )}
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
                onSubmitEditing={addItem}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Цена на продукта" />
            </View>
          </View>

          {/* Browse / Compare buttons */}
          <View style={s.catalogBtnRow}>
            <TouchableOpacity style={s.catalogBtn} onPress={openCatalog} activeOpacity={0.75} accessibilityLabel="Избери от магазин" accessibilityRole="button">
              <Ionicons name="storefront-outline" size={15} color={colors.primary} />
              <Text style={s.catalogBtnText}>От магазин</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.compareBtn} onPress={() => { setCompareQuery(''); setCompareVisible(true); }} activeOpacity={0.75} accessibilityLabel="Сравни цени" accessibilityRole="button">
              <Ionicons name="git-compare-outline" size={15} color={colors.orange} />
              <Text style={s.compareBtnText}>Сравни цени</Text>
            </TouchableOpacity>
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
                  style={[s.catChip, active && { backgroundColor: catColors.bg }, active && s.catChipActive]}
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
            <AnimatedPressable style={s.addBtn} onPress={addItem} accessibilityLabel={editingItemId ? "Обнови продукт" : "Добави продукт"}>
              <Ionicons name={editingItemId ? "checkmark-circle" : "add-circle"} size={17} color="#fff" />
              <Text style={s.addBtnText}>{editingItemId ? 'Обнови' : 'Добави'}</Text>
            </AnimatedPressable>
          </View>

          {editingItemId && (
            <TouchableOpacity style={s.cancelEditBtn} onPress={cancelEdit}>
              <Text style={s.cancelEditBtnText}>Отказ от редактиране</Text>
            </TouchableOpacity>
          )}

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
        {items.length > 0 ? (
          <View style={s.itemsWrap}>
            <Text style={s.itemsLabel}>{items.length} продукта</Text>
            <View style={s.itemsList}>
              {items.map((item, idx) => {
                const info = getPriceInfo(item.name);
                return (
                  <FadeInView key={item.id} delay={Math.min(idx * 30, 120)} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                    <View style={[s.itemIconWrap, { backgroundColor: getCategoryColors(item.category, isDark).bg }]}>
                      <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
                    </View>
                    <View style={s.itemInfo}>
                      <TouchableOpacity style={s.itemNameRow} onPress={() => startEdit(item)}>
                        <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                        {info && (
                          <Text style={[s.trendBadge, { color: trendColor[info.trend] }]}>
                            {TREND_ICON[info.trend]} {info.trend === 'down' ? 'Намалено' : info.trend === 'up' ? 'Поскъпнало' : ''}
                          </Text>
                        )}
                      </TouchableOpacity>
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
                  </FadeInView>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="cart-outline" size={48} color={colors.border} />
            </View>
            <Text style={s.emptyTitle}>Списъкът е празен</Text>
            <Text style={s.emptyText}>Добавете продукти, за да започнете вашето пазаруване</Text>
          </View>
        )}

        {/* Budget summary — the single progress surface */}
        {items.length > 0 && (
          <FadeInView duration={300} style={[s.summaryCard, overBudget && s.summaryCardOver]}>
            <View style={s.summaryTop}>
              <Text style={s.summaryTotal}>{total.toFixed(2)} €</Text>
              <Text style={s.summaryOf}>от {budgetNum.toFixed(2)} €</Text>
            </View>
            <View
              style={[s.summaryBarTrack, { backgroundColor: colors.borderLight }]}
              onLayout={e => { barTrackWidth.value = e.nativeEvent.layout.width; }}
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
          </FadeInView>
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
            <OverflowItem icon="calculator-outline" label="Планиране на бюджет"
              onPress={() => { setOverflowVisible(false); navigation.navigate('BudgetSetup'); }} s={s} colors={colors} />
            <OverflowItem icon="restaurant-outline" label="Идеи за готвене (AI)"
              onPress={() => { setOverflowVisible(false); navigation.navigate('Meals', { products: items }); }} s={s} colors={colors} />
            <OverflowItem icon={isDark ? 'sunny-outline' : 'moon-outline'} label={isDark ? 'Светла тема' : 'Тъмна тема'}
              onPress={() => { toggleTheme(); }} s={s} colors={colors} />
            {lastRemovedItem && (
              <OverflowItem icon="refresh-outline" label="Възстанови последно изтрито"
                onPress={() => { setOverflowVisible(false); undoRemove(); }} s={s} colors={colors} />
            )}
            {items.length > 0 && (
              <OverflowItem icon="bookmark-outline" label="Запази като шаблон"
                onPress={handleSaveTemplate} s={s} colors={colors} />
            )}
            {items.length > 0 && (
              <OverflowItem icon="share-social-outline" label="Сподели списъка"
                onPress={handleShareList} s={s} colors={colors} />
            )}
            <OverflowItem icon="enter-outline" label="Присъедини се към списък"
              onPress={() => { setOverflowVisible(false); setJoinModalVisible(true); }} s={s} colors={colors} />
            {shareCode && (
              <OverflowItem icon="wifi-outline" label={`Споделен: ${shareCode}`}
                onPress={() => { setOverflowVisible(false); setShareModalVisible(true); }} s={s} colors={colors} />
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

      {/* Share modal */}
      <Modal visible={shareModalVisible} animationType="fade" transparent onRequestClose={() => setShareModalVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={[s.sheet, { paddingBottom: 24, alignItems: 'center' }]}>
            <Ionicons name="share-social" size={40} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={s.sheetTitle}>Споделен списък</Text>
            {shareLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />}
            {shareCode ? (
              <>
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                  Сподели този код с хора, за да редактирате списъка заедно в реално време.
                </Text>
                <TouchableOpacity
                  style={[s.shareCodeBox, { borderColor: colors.primary }]}
                  onPress={() => Share.share({ message: `Присъедини се към моя списък с код: ${shareCode}` })}
                  activeOpacity={0.8}
                  accessibilityLabel="Копирай кода"
                >
                  <Text style={[s.shareCodeText, { color: colors.primary }]}>{shareCode}</Text>
                  <Ionicons name="share-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 6 }}>Натисни за споделяне</Text>
                {sharedList?.members?.length > 0 && (
                  <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                    <Text style={[s.libSectionLabel, { marginBottom: 6 }]}>Участници ({sharedList.members.length})</Text>
                    {sharedList.members.map((m, i) => (
                      <Text key={i} style={{ color: colors.textSecondary, fontSize: 14 }}>
                        {m.id === user?.id ? `${m.name} (ти)` : m.name}
                      </Text>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={[s.templateCancelBtn, { marginTop: 16 }]} onPress={handleDisconnectShared}>
                  <Text style={[s.templateCancelText, { color: colors.red }]}>Прекъсни споделянето</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TouchableOpacity style={[s.templateConfirmBtn, { marginTop: 8, alignSelf: 'stretch' }]} onPress={() => setShareModalVisible(false)}>
              <Text style={s.templateConfirmText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Store catalog picker */}
      <Modal visible={catalogVisible} animationType="slide" transparent onRequestClose={() => setCatalogVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={[s.sheet, s.catalogSheet]}>
            <View style={s.catalogHeader}>
              <Text style={s.sheetTitle}>Каталог на магазини</Text>
              <TouchableOpacity onPress={() => setCatalogVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Затвори" accessibilityRole="button">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.catalogSearch}>
              <Ionicons name="search-outline" size={16} color={colors.textQuaternary} />
              <TextInput
                style={s.catalogSearchInput}
                placeholder="Търсене на продукт..."
                placeholderTextColor={colors.textQuaternary}
                value={catalogQuery}
                onChangeText={setCatalogQuery}
                returnKeyType="search"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Търси в каталога"
              />
              {catalogQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCatalogQuery('')} accessibilityLabel="Изчисти" accessibilityRole="button">
                  <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catalogStoreFilters} keyboardShouldPersistTaps="handled">
              {CATALOG_STORES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[s.catalogStoreChip, catalogStoreFilter === st && s.catalogStoreChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setCatalogStoreFilter(st); }}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: catalogStoreFilter === st }}
                  accessibilityLabel={st}
                >
                  <Text style={[s.catalogStoreChipText, catalogStoreFilter === st && { color: colors.primary }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filteredCatalog}
              keyExtractor={(item, idx) => `${item.name}-${item.store}-${idx}`}
              renderItem={({ item: p }) => {
                const added = items.some((i) => i.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <TouchableOpacity
                    style={s.catalogRow}
                    onPress={() => addFromCatalog(p)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Добави ${p.name} ${p.price.toFixed(2)} лв от ${p.store}`}
                    accessibilityRole="button"
                  >
                    <View style={[s.catalogIcon, { backgroundColor: getCategoryColors(p.category, isDark).bg }]}>
                      <Text style={{ fontSize: 16 }}>{getCategoryEmoji(p.category)}</Text>
                    </View>
                    <View style={s.catalogInfo}>
                      <Text style={s.catalogName} numberOfLines={1}>{p.name}</Text>
                      <View style={s.catalogStoreBadge}>
                        <Text style={s.catalogStoreBadgeText}>{p.store}</Text>
                      </View>
                    </View>
                    <Text style={[s.catalogPrice, added && { color: colors.textTertiary }]}>{p.price.toFixed(2)} лв</Text>
                    <View style={[s.catalogAddBtn, added && { backgroundColor: colors.greenLight }]}>
                      <Ionicons name={added ? 'checkmark' : 'add'} size={18} color={added ? colors.green : '#fff'} />
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.borderLight, marginLeft: 52 }} />}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
                  <Ionicons name="search-outline" size={32} color={colors.border} />
                  <Text style={{ color: colors.textTertiary, marginTop: 8, fontSize: 14 }}>Няма намерени продукти</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Price comparison modal */}
      <Modal visible={compareVisible} animationType="slide" transparent onRequestClose={() => setCompareVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={[s.sheet, s.catalogSheet]}>
            <View style={s.catalogHeader}>
              <View>
                <Text style={s.sheetTitle}>Сравнение на цени</Text>
                <Text style={s.compareSubtitle}>Намерете най-евтиния продукт</Text>
              </View>
              <TouchableOpacity onPress={() => setCompareVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Затвори" accessibilityRole="button">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.catalogSearch}>
              <Ionicons name="search-outline" size={16} color={colors.textQuaternary} />
              <TextInput
                style={s.catalogSearchInput}
                placeholder="напр. мляко, масло, хляб..."
                placeholderTextColor={colors.textQuaternary}
                value={compareQuery}
                onChangeText={setCompareQuery}
                autoFocus
                returnKeyType="search"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Търси продукт за сравнение"
              />
              {compareQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCompareQuery('')} accessibilityLabel="Изчисти" accessibilityRole="button">
                  <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
                </TouchableOpacity>
              )}
            </View>

            {compareQuery.length >= 2 && compareResults.length > 0 && (
              <View style={s.compareSummary}>
                <Text style={s.compareSummaryText}>
                  {compareResults.length} резултата · най-евтино: <Text style={s.compareBest}>{compareResults[0].price.toFixed(2)} лв</Text>
                </Text>
              </View>
            )}

            <FlatList
              data={compareResults}
              keyExtractor={(item, idx) => `${item.name}-${item.store}-${idx}`}
              renderItem={({ item: p, index }) => {
                const added = items.some((i) => i.name.toLowerCase() === p.name.toLowerCase());
                const isCheapest = index === 0;
                const storeColor = STORE_COLORS[p.store] ?? { bg: colors.cardAlt, text: colors.textTertiary };
                return (
                  <TouchableOpacity
                    style={[s.compareRow, isCheapest && s.compareRowBest]}
                    onPress={() => addFromCatalog(p)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Добави ${p.name} от ${p.store} за ${p.price.toFixed(2)} лв`}
                    accessibilityRole="button"
                  >
                    {isCheapest && (
                      <View style={s.compareBestBadge}>
                        <Text style={s.compareBestBadgeText}>НАЙ-ЕВТИНО</Text>
                      </View>
                    )}
                    <View style={s.compareRowInner}>
                      <View style={[s.catalogIcon, { backgroundColor: getCategoryColors(p.category, isDark).bg }]}>
                        <Text style={{ fontSize: 16 }}>{getCategoryEmoji(p.category)}</Text>
                      </View>
                      <View style={s.catalogInfo}>
                        <Text style={s.compareProductName} numberOfLines={2}>{p.name}</Text>
                        <View style={[s.compareStoreBadge, { backgroundColor: storeColor.bg }]}>
                          <Text style={[s.compareStoreBadgeText, { color: storeColor.text }]}>{p.store}</Text>
                        </View>
                      </View>
                      <View style={s.comparePriceCol}>
                        <Text style={[s.comparePrice, isCheapest && s.comparePriceBest]}>{p.price.toFixed(2)} лв</Text>
                      </View>
                      <View style={[s.catalogAddBtn, added && { backgroundColor: colors.greenLight }]}>
                        <Ionicons name={added ? 'checkmark' : 'add'} size={18} color={added ? colors.green : '#fff'} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.borderLight, marginLeft: 52 }} />}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 48, opacity: 0.5 }}>
                  <Ionicons name="git-compare-outline" size={40} color={colors.border} />
                  <Text style={{ color: colors.textTertiary, marginTop: 12, fontSize: 15, fontWeight: '600' }}>
                    {compareQuery.length < 2 ? 'Въведете поне 2 букви' : 'Няма намерени продукти'}
                  </Text>
                  <Text style={{ color: colors.textQuaternary, marginTop: 4, fontSize: 13 }}>
                    {compareQuery.length < 2 ? 'за да сравните цени между магазини' : 'Опитайте с различна дума'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Join shared list modal */}
      <Modal visible={joinModalVisible} animationType="fade" transparent onRequestClose={() => setJoinModalVisible(false)}>
        <View style={s.sheetBackdrop}>
          <View style={[s.sheet, { paddingBottom: 24 }]}>
            <Text style={s.sheetTitle}>Присъедини се</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
              Въведи кода, с който някой е споделил списъка си.
            </Text>
            <TextInput
              style={[s.templateNameInput, { letterSpacing: 4, textAlign: 'center', fontWeight: '700', fontSize: 20 }]}
              placeholder="ABC123"
              placeholderTextColor={colors.textQuaternary}
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleJoinList}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Код за присъединяване"
            />
            {shareError ? <Text style={{ color: colors.red, fontSize: 13, marginTop: 4 }}>{shareError}</Text> : null}
            <View style={s.templateModalBtns}>
              <TouchableOpacity style={s.templateCancelBtn} onPress={() => { setJoinModalVisible(false); setJoinCode(''); }}>
                <Text style={s.templateCancelText}>Отказ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.templateConfirmBtn, shareLoading && { opacity: 0.6 }]} onPress={handleJoinList} disabled={shareLoading}>
                {shareLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.templateConfirmText}>Присъедини се</Text>}
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
    addNameInput: { flex: 1, fontSize: 16, color: c.text, paddingVertical: 12, fontWeight: '500' },
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
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 20, backgroundColor: c.cardAlt, borderWidth: 1, borderColor: 'transparent' },
    catChipActive: { borderColor: c.primaryLight, ...sh.sm },
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
    noteInput: { flex: 1, fontSize: 14, color: c.text, paddingTop: 0 },

    cancelEditBtn: { alignSelf: 'center', marginTop: -4, marginBottom: 10, padding: 8 },
    cancelEditBtnText: { color: c.textQuaternary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

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
    summaryBarFill: { height: 6, width: '100%', borderRadius: 3 },
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

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.8 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...sh.sm },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: c.textTertiary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
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
    shareCodeBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 2, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16,
      marginTop: 4,
    },
    shareCodeText: { fontSize: 28, fontWeight: '800', letterSpacing: 6 },

    catalogBtnRow: { flexDirection: 'row', gap: 8 },
    catalogBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: c.primaryLight, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 11,
    },
    catalogBtnText: { fontSize: 13, fontWeight: '600', color: c.primary },
    compareBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: c.orangeLight, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 11,
    },
    compareBtnText: { fontSize: 13, fontWeight: '600', color: c.orange },

    catalogSheet: { height: '90%', paddingBottom: 0, gap: 12 },
    catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    catalogSearch: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.cardAlt, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 10,
    },
    catalogSearchInput: { flex: 1, fontSize: 15, color: c.text },

    catalogStoreFilters: { gap: 8, paddingBottom: 4 },
    catalogStoreChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: c.cardAlt, borderWidth: 1.5, borderColor: 'transparent',
    },
    catalogStoreChipActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    catalogStoreChipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },

    catalogRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 11, paddingHorizontal: 2,
    },
    catalogIcon: {
      width: 36, height: 36, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    catalogInfo: { flex: 1, gap: 3 },
    catalogName: { fontSize: 14, fontWeight: '600', color: c.text },
    catalogStoreBadge: {
      alignSelf: 'flex-start', backgroundColor: c.cardAlt,
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    catalogStoreBadgeText: { fontSize: 10, fontWeight: '600', color: c.textTertiary },
    catalogPrice: { fontSize: 14, fontWeight: '700', color: c.primary, minWidth: 56, textAlign: 'right' },
    catalogAddBtn: {
      width: 30, height: 30, borderRadius: 9,
      backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center',
    },

    compareSubtitle: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
    compareSummary: {
      backgroundColor: c.primaryLight, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    compareSummaryText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    compareBest: { fontWeight: '800', color: c.green },

    compareRow: {
      paddingVertical: 4, borderRadius: 12,
    },
    compareRowBest: {
      backgroundColor: isDark ? '#0A2A0C' : '#F0FFF0',
      marginHorizontal: -2, paddingHorizontal: 2,
    },
    compareBestBadge: {
      alignSelf: 'flex-start', backgroundColor: c.green,
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
      marginBottom: 4, marginLeft: 46,
    },
    compareBestBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    compareRowInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    compareProductName: { fontSize: 13, fontWeight: '600', color: c.text, lineHeight: 18 },
    compareStoreBadge: {
      alignSelf: 'flex-start', borderRadius: 6,
      paddingHorizontal: 7, paddingVertical: 2, marginTop: 3,
    },
    compareStoreBadgeText: { fontSize: 10, fontWeight: '700' },
    comparePriceCol: { alignItems: 'flex-end', minWidth: 60 },
    comparePrice: { fontSize: 15, fontWeight: '700', color: c.primary },
    comparePriceBest: { color: c.green, fontSize: 16 },
  });
}
