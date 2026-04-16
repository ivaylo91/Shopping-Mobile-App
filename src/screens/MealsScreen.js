import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, FlatList, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getCategoryIcon } from '../utils/ui';
import { generateMealPlan, generateSingleMeal, hasApiKey } from '../services/mealAI';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

// ─── Fallback recipes (used when no API key is configured) ────────────────────
// Keeps the screen functional without an API key.

const FALLBACK = {
  breakfast: {
    title: 'Яйца на очи с хляб',
    desc: 'Бърза закуска с яйца, масло и препечен хляб.',
    fromList: [], extra: ['Яйца', 'Масло', 'Хляб'],
    steps: ['Разтопете масло в тиган на среден огън.', 'Счупете яйцата внимателно в тигана.', 'Запечете до желана степен и поднесете с хляб.'],
    calories: 310, protein: 14, carbs: 28, fat: 18, prepTime: 10,
  },
  lunch: {
    title: 'Пилешко с ориз',
    desc: 'Класическо пиле на тиган с гарнитура от ориз.',
    fromList: [], extra: ['Пилешко филе', 'Ориз', 'Подправки'],
    steps: ['Нарежете пилешкото на хапки и подправете.', 'Запържете на тиган с малко масло 8–10 минути.', 'Сварете ориза и поднесете заедно.'],
    calories: 450, protein: 38, carbs: 42, fat: 14, prepTime: 25,
  },
  dinner: {
    title: 'Зеленчукова яхния',
    desc: 'Лека вечеря от сезонни зеленчуци.',
    fromList: [], extra: ['Зеленчуци по избор', 'Домати', 'Лук', 'Олио'],
    steps: ['Нарежете зеленчуците на парчета.', 'Задушете лука в олио, добавете зеленчуците.', 'Добавете домати и гответе 20 минути.'],
    calories: 220, protein: 6, carbs: 32, fat: 8, prepTime: 30,
  },
  snack: {
    title: 'Плодова салата',
    desc: 'Свеж снак от пресни плодове с мед.',
    fromList: [], extra: ['Плодове по избор', 'Мед', 'Лимонов сок'],
    steps: ['Нарежете плодовете на хапки.', 'Полейте с мед и лимонов сок.', 'Разбъркайте и сервирайте веднага.'],
    calories: 130, protein: 2, carbs: 30, fat: 1, prepTime: 10,
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

const FILTERS = [
  { key: 'vegetarian',  label: 'Вегет.',       icon: '🥦' },
  { key: 'quick',       label: '≤25мин',        icon: '⚡' },
  { key: 'highProtein', label: 'Протеин',       icon: '💪' },
];

function cleanName(raw = '') {
  return raw
    .replace(/\s*(≈|~)?\d+(\.\d+)?(кг|г|л|мл)\b/gi, '')
    .replace(/\s*\d+x\d+[^\s]*/gi, '')
    .replace(/\bXXL\b|\bXL\b/gi, '')
    .replace(/\s+/g, ' ').trim()
    .split(' ').slice(0, 3).join(' ');
}

function youtubeUrl(title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' рецепта')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCalCard({ item }) {
  return (
    <View style={styles.calCard}>
      <Text style={styles.calCardIcon}>{getCategoryIcon(item.category)}</Text>
      <Text style={styles.calCardName} numberOfLines={2}>{cleanName(item.name)}</Text>
      <View style={styles.calBadge}>
        <Text style={styles.calBadgeText}>{item.calories ?? '—'}</Text>
        <Text style={styles.calBadgeUnit}>ккал</Text>
      </View>
    </View>
  );
}

function MacroBar({ protein, carbs, fat, calories }) {
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{protein}г</Text>
        <Text style={styles.macroLabel}>Протеин</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{carbs}г</Text>
        <Text style={styles.macroLabel}>Въглехидрати</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{fat}г</Text>
        <Text style={styles.macroLabel}>Мазнини</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: '#6C63FF' }]}>~{calories}</Text>
        <Text style={styles.macroLabel}>ккал</Text>
      </View>
    </View>
  );
}

function RecipeCardSkeleton({ color }) {
  return (
    <View style={[styles.card, { borderLeftColor: color ?? '#ddd' }]}>
      <View style={styles.cardTopRow}>
        <SkeletonBox style={{ width: 90, height: 30, borderRadius: 20 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonBox style={{ width: 60, height: 24, borderRadius: 12 }} />
          <SkeletonBox style={{ width: 70, height: 24, borderRadius: 12 }} />
        </View>
      </View>
      <SkeletonBox style={{ width: '80%', height: 18, borderRadius: 8, marginBottom: 8 }} />
      <SkeletonBox style={{ width: '55%', height: 12, borderRadius: 6, marginBottom: 16 }} />
      <SkeletonBox style={{ width: '100%', height: 56, borderRadius: 10 }} />
    </View>
  );
}

// ─── Recipe detail modal ──────────────────────────────────────────────────────

function RecipeModal({ recipe, slotColor, visible, onClose, onYouTube }) {
  if (!recipe) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
          <Text style={styles.modalTitle} numberOfLines={2}>{recipe.title}</Text>
          <TouchableOpacity style={styles.ytSmallBtn} onPress={onYouTube}>
            <Ionicons name="logo-youtube" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Quick info row */}
          <View style={styles.modalInfoRow}>
            <View style={styles.modalInfoChip}>
              <Ionicons name="time-outline" size={14} color="#6C63FF" />
              <Text style={styles.modalInfoText}>{recipe.prepTime} мин</Text>
            </View>
            <View style={styles.modalInfoChip}>
              <Text style={styles.modalInfoText}>🔥 {recipe.calories} ккал</Text>
            </View>
            <View style={styles.modalInfoChip}>
              <Text style={styles.modalInfoText}>💪 {recipe.protein}г</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.modalDesc}>{recipe.desc}</Text>

          {/* Products from list */}
          {recipe.fromList?.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>✓ От вашия списък</Text>
              {recipe.fromList.map((ing, i) => (
                <View key={i} style={styles.modalIngredientRow}>
                  <View style={[styles.modalIngDot, { backgroundColor: slotColor }]} />
                  <Text style={styles.modalIngText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Extra ingredients needed */}
          {recipe.extra?.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: '#f39c12' }]}>🛒 Допълнително нужни</Text>
              {recipe.extra.map((ing, i) => (
                <View key={i} style={styles.modalIngredientRow}>
                  <View style={[styles.modalIngDot, { backgroundColor: '#f39c12' }]} />
                  <Text style={styles.modalIngText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Steps */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>📋 Приготвяне</Text>
            {recipe.steps?.map((step, i) => (
              <View key={i} style={styles.modalStepRow}>
                <View style={[styles.modalStepNum, { backgroundColor: slotColor }]}>
                  <Text style={styles.modalStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.modalStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list } = route.params || {};
  const allProducts = list || [];

  const { show: showToast } = useToast();

  const [plan, setPlan]         = useState(null);      // null = loading
  const [planError, setPlanError] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(null); // key of slot being swapped
  const [filters, setFilters]   = useState({ vegetarian: false, quick: false, highProtein: false });
  const [excludedBySlot, setExcludedBySlot] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null); // for modal

  // ── Load plan ──────────────────────────────────────────────────────────────
  const loadPlan = useCallback(async (currentFilters) => {
    setPlan(null);
    setPlanError(false);
    try {
      if (hasApiKey()) {
        const result = await generateMealPlan(allProducts, currentFilters);
        setPlan(result);
      } else {
        // No API key — use fallback immediately
        setPlan(FALLBACK);
      }
    } catch (err) {
      console.warn('generateMealPlan failed:', err.message);
      setPlan(FALLBACK);
      setPlanError(true);
    }
  }, [allProducts]);

  useEffect(() => {
    loadPlan(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount; filter changes go through toggleFilter

  // ── Derived ───────────────────────────────────────────────────────────────
  const productsSortedByCal = useMemo(
    () => [...allProducts].filter((p) => p.calories > 0).sort((a, b) => b.calories - a.calories),
    [allProducts]
  );

  const totals = useMemo(() => {
    if (!plan) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    return MEAL_SLOTS.reduce(
      (acc, { key }) => {
        const r = plan[key];
        if (!r) return acc;
        return {
          protein:  acc.protein  + (r.protein  || 0),
          carbs:    acc.carbs    + (r.carbs    || 0),
          fat:      acc.fat      + (r.fat      || 0),
          calories: acc.calories + (r.calories || 0),
        };
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [plan]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleFilter = useCallback((key) => {
    Haptics.selectionAsync();
    setFilters((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setExcludedBySlot({});
      loadPlan(next);
      return next;
    });
  }, [loadPlan]);

  const regenerateAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExcludedBySlot({});
    loadPlan(filters);
  }, [filters, loadPlan]);

  const swapMeal = useCallback(async (slotKey) => {
    if (!plan) return;
    const currentTitle = plan[slotKey]?.title;
    const excluded = [
      ...(excludedBySlot[slotKey] ?? []),
      ...(currentTitle ? [currentTitle] : []),
    ];

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingSlot(slotKey);
    try {
      const recipe = hasApiKey()
        ? await generateSingleMeal(allProducts, slotKey, excluded, filters)
        : FALLBACK[slotKey];
      setPlan((prev) => ({ ...prev, [slotKey]: recipe }));
      setExcludedBySlot((prev) => ({ ...prev, [slotKey]: excluded }));
    } catch (err) {
      console.warn('generateSingleMeal failed:', err.message);
      showToast('Неуспешна замяна на рецептата', 'error');
    } finally {
      setLoadingSlot(null);
    }
  }, [plan, excludedBySlot, allProducts, filters]);

  const openRecipe = useCallback((slotKey) => {
    Haptics.selectionAsync();
    setSelectedSlot(slotKey);
  }, []);

  const closeModal = useCallback(() => setSelectedSlot(null), []);

  // ── Render ────────────────────────────────────────────────────────────────
  const selectedSlotMeta = MEAL_SLOTS.find((s) => s.key === selectedSlot);
  const selectedRecipe   = selectedSlot ? plan?.[selectedSlot] : null;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
          <Text style={styles.headerSub}>
            {hasApiKey() ? 'Генерирано от AI по вашите продукти' : 'Примерни рецепти'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.regenerateBtn, !plan && styles.regenerateBtnDisabled]}
          onPress={regenerateAll}
          disabled={!plan}
        >
          <Ionicons name="shuffle-outline" size={18} color={plan ? '#6C63FF' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label, icon }) => {
          const active = filters[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => toggleFilter(key)}
              activeOpacity={0.8}
              disabled={!plan}
            >
              <Text style={styles.filterChipIcon}>{icon}</Text>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {planError && (
          <View style={styles.fallbackBadge}>
            <Ionicons name="warning-outline" size={12} color="#f39c12" />
            <Text style={styles.fallbackText}>Примерни рецепти</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Products calories strip */}
        {productsSortedByCal.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Продукти • килокалории</Text>
            <FlatList
              data={productsSortedByCal}
              keyExtractor={(item) => item.id ?? item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calRow}
              renderItem={({ item }) => <ProductCalCard item={item} />}
            />
          </View>
        )}

        {/* Macros bar */}
        {plan && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Дневни макронутриенти</Text>
            <MacroBar {...totals} />
          </View>
        )}

        {/* Recipe cards */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Дневен план</Text>

          {MEAL_SLOTS.map(({ key, label, icon, color }) => {
            const recipe    = plan?.[key];
            const isLoading = !plan || loadingSlot === key;

            if (isLoading) {
              return <RecipeCardSkeleton key={key} color={color} />;
            }

            return (
              <Animated.View key={`${key}-${recipe.title}`} entering={FadeIn.duration(300)} style={[styles.card, { borderLeftColor: color }]}>

                {/* Top row */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeIcon}>{icon}</Text>
                    <Text style={styles.badgeLabel}>{label}</Text>
                  </View>
                  <View style={styles.cardTopRight}>
                    <View style={styles.prepTimeBadge}>
                      <Ionicons name="time-outline" size={11} color="#999" />
                      <Text style={styles.prepTimeText}>{recipe.prepTime} мин</Text>
                    </View>
                    <View style={[styles.calChip, { borderColor: color }]}>
                      <Text style={[styles.calChipText, { color }]}>{recipe.calories} ккал</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.swapBtn}
                      onPress={() => swapMeal(key)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#6C63FF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.recipeTitle}>{recipe.title}</Text>

                {/* From list pills (green) */}
                {recipe.fromList?.length > 0 && (
                  <View style={styles.pillsSection}>
                    <Text style={styles.fromListLabel}>✓ От вашия списък:</Text>
                    <View style={styles.pills}>
                      {recipe.fromList.slice(0, 4).map((name, i) => (
                        <View key={i} style={[styles.pill, { borderColor: color }]}>
                          <Text style={[styles.pillText, { color }]}>{cleanName(name)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Extra pills (orange) */}
                {recipe.extra?.length > 0 && (
                  <View style={styles.pillsSection}>
                    <Text style={styles.extraLabel}>🛒 Допълнително:</Text>
                    <View style={styles.pills}>
                      {recipe.extra.slice(0, 3).map((name, i) => (
                        <View key={i} style={styles.extraPill}>
                          <Text style={styles.extraPillText}>{name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Description */}
                <View style={styles.descBox}>
                  <Text style={styles.descText}>{recipe.desc}</Text>
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.linkBtn, { backgroundColor: color }]}
                    onPress={() => openRecipe(key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="book-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.linkBtnText}>Виж рецепта</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ytBtn}
                    onPress={() => {
                      const { Linking } = require('react-native');
                      Linking.openURL(youtubeUrl(recipe.title)).catch(() => {});
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-youtube" size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.ytBtnText}>YouTube</Text>
                  </TouchableOpacity>
                </View>

              </Animated.View>
            );
          })}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Обратно</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>🏠 Начало</Text>
        </TouchableOpacity>
      </View>

      {/* Recipe detail modal */}
      <RecipeModal
        visible={!!selectedSlot && !!selectedRecipe}
        recipe={selectedRecipe}
        slotColor={selectedSlotMeta?.color ?? '#6C63FF'}
        onClose={closeModal}
        onYouTube={() => {
          const { Linking } = require('react-native');
          Linking.openURL(youtubeUrl(selectedRecipe?.title ?? '')).catch(() => {});
        }}
      />

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub:   { fontSize: 12, color: '#999' },
  regenerateBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  regenerateBtnDisabled: { backgroundColor: '#f5f5f5' },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0F0', backgroundColor: '#fff',
  },
  filterChipActive:     { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  filterChipIcon:       { fontSize: 12 },
  filterChipText:       { fontSize: 12, fontWeight: '700', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  fallbackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#FFF8ED',
    borderWidth: 1.5, borderColor: '#f39c12',
  },
  fallbackText: { fontSize: 11, fontWeight: '700', color: '#f39c12' },

  scroll: { padding: 16 },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },

  // Macros bar
  macroBar: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  macroItem:    { flex: 1, alignItems: 'center' },
  macroValue:   { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  macroLabel:   { fontSize: 10, fontWeight: '600', color: '#aaa', marginTop: 2 },
  macroDivider: { width: 1, height: 32, backgroundColor: '#f0f0f0' },

  // Products calories strip
  calRow:       { paddingBottom: 4, gap: 10 },
  calCard: {
    width: 90, backgroundColor: '#fff', borderRadius: 14,
    padding: 10, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  calCardIcon: { fontSize: 22 },
  calCardName: { fontSize: 10, fontWeight: '600', color: '#444', textAlign: 'center', lineHeight: 13 },
  calBadge: {
    backgroundColor: '#F0EEFF', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center', marginTop: 4,
  },
  calBadgeText: { fontSize: 13, fontWeight: '800', color: '#6C63FF' },
  calBadgeUnit: { fontSize: 9, fontWeight: '600', color: '#6C63FF', marginTop: -1 },

  // Skeleton
  skeletonChip: {
    borderRadius: 20, backgroundColor: '#E8E8F0',
  },
  skeletonLine: {
    borderRadius: 8, backgroundColor: '#E8E8F0', marginBottom: 4,
  },

  // Recipe card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  cardTopRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5,
  },
  badgeIcon:      { fontSize: 13 },
  badgeLabel:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  prepTimeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F7F8FC', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  prepTimeText:   { fontSize: 11, fontWeight: '600', color: '#999' },
  calChip: {
    borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  calChipText:    { fontSize: 12, fontWeight: '800' },
  swapBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center',
  },

  recipeTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 12, lineHeight: 23 },

  pillsSection:   { marginBottom: 10 },
  fromListLabel:  { fontSize: 11, color: '#2ecc71', fontWeight: '700', marginBottom: 7 },
  extraLabel:     { fontSize: 11, color: '#f39c12', fontWeight: '700', marginBottom: 7 },
  pills:          { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pillText:       { fontSize: 12, fontWeight: '700' },
  extraPill: {
    backgroundColor: '#FFF8ED', borderWidth: 1.5, borderColor: '#f39c12',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  extraPillText:  { fontSize: 12, fontWeight: '700', color: '#f39c12' },

  descBox:  { backgroundColor: '#FFFBEA', borderRadius: 10, padding: 12, marginBottom: 12 },
  descText: { fontSize: 13, color: '#7d6608', lineHeight: 20 },

  btnRow:       { flexDirection: 'row', gap: 10 },
  linkBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  linkBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  ytBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13, backgroundColor: '#FF0000',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  ytBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  footer: {
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  backBtn: {
    flex: 1, backgroundColor: '#F0EEFF', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  backBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Recipe Modal ──
  modalContainer: { flex: 1, backgroundColor: '#F7F8FC' },
  modalHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee', gap: 12,
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  ytSmallBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF0000', justifyContent: 'center', alignItems: 'center',
  },

  modalBody: { flex: 1, padding: 20 },

  modalInfoRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modalInfoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0EEFF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  modalInfoText: { fontSize: 13, fontWeight: '700', color: '#6C63FF' },

  modalDesc: {
    fontSize: 14, color: '#555', lineHeight: 21,
    backgroundColor: '#FFFBEA', borderRadius: 10,
    padding: 14, marginBottom: 20,
  },

  modalSection:      { marginBottom: 20 },
  modalSectionTitle: {
    fontSize: 13, fontWeight: '800', color: '#1A1A2E',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  modalIngredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalIngDot:        { width: 8, height: 8, borderRadius: 4 },
  modalIngText:       { fontSize: 14, color: '#333', flex: 1 },

  modalStepRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14,
  },
  modalStepNum: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  modalStepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalStepText:    { flex: 1, fontSize: 14, color: '#333', lineHeight: 22 },
});
