import {
  View, StyleSheet, TouchableOpacity,
  ScrollView, Modal, ActivityIndicator, Linking,
} from 'react-native';
import Text from '../components/Text';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FadeInView from '../components/FadeInView';
import { getCategoryIcon } from '../utils/ui';
import { generateMealPlan, generateSingleMeal, hasApiKey } from '../services/mealAI';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { useBudgetLists } from '../hooks/useBudgetLists';

// ─── Fallback recipes ──────────────────────────────────────────────────────────

const FALLBACK = {
  breakfast: {
    title: 'Яйца на очи с хляб', desc: 'Бърза закуска с яйца, масло и препечен хляб.',
    fromList: [], extra: ['Яйца', 'Масло', 'Хляб'],
    steps: ['Разтопете масло в тиган на среден огън.', 'Счупете яйцата внимателно в тигана.', 'Запечете до желана степен и поднесете с хляб.'],
    calories: 310, protein: 14, carbs: 28, fat: 18, prepTime: 10,
  },
  lunch: {
    title: 'Пилешко с ориз', desc: 'Класическо пиле на тиган с гарнитура от ориз.',
    fromList: [], extra: ['Пилешко филе', 'Ориз', 'Подправки'],
    steps: ['Нарежете пилешкото на хапки и подправете.', 'Запържете на тиган с малко масло 8–10 минути.', 'Сварете ориза и поднесете заедно.'],
    calories: 450, protein: 38, carbs: 42, fat: 14, prepTime: 25,
  },
  dinner: {
    title: 'Зеленчукова яхния', desc: 'Лека вечеря от сезонни зеленчуци.',
    fromList: [], extra: ['Зеленчуци по избор', 'Домати', 'Лук', 'Олио'],
    steps: ['Нарежете зеленчуците на парчета.', 'Задушете лука в олио, добавете зеленчуците.', 'Добавете домати и гответе 20 минути.'],
    calories: 220, protein: 6, carbs: 32, fat: 8, prepTime: 30,
  },
  snack: {
    title: 'Плодова салата', desc: 'Свеж снак от пресни плодове с мед.',
    fromList: [], extra: ['Плодове по избор', 'Мед', 'Лимонов сок'],
    steps: ['Нарежете плодовете на хапки.', 'Полейте с мед и лимонов сок.', 'Разбъркайте и сервирайте веднага.'],
    calories: 130, protein: 2, carbs: 30, fat: 1, prepTime: 10,
  },
};

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', colorKey: 'orange' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  colorKey: 'primary' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  colorKey: 'green' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   colorKey: 'red' },
];

const FILTERS = [
  { key: 'vegetarian',  label: 'Вегет.',  icon: '🥦' },
  { key: 'quick',       label: '≤25мин',  icon: '⚡' },
  { key: 'highProtein', label: 'Протеин', icon: '💪' },
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

function RecipeCardSkeleton() {
  return (
    <View style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
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

function MacroBar({ protein, carbs, fat, calories, colors }) {
  return (
    <View style={[mS.bar, { backgroundColor: colors.card }]}>
      <View style={mS.item}>
        <Text style={[mS.val, { color: colors.text }]}>{protein}г</Text>
        <Text style={[mS.lbl, { color: colors.textTertiary }]}>Протеин</Text>
      </View>
      <View style={[mS.div, { backgroundColor: colors.border }]} />
      <View style={mS.item}>
        <Text style={[mS.val, { color: colors.text }]}>{carbs}г</Text>
        <Text style={[mS.lbl, { color: colors.textTertiary }]}>Въглехидрати</Text>
      </View>
      <View style={[mS.div, { backgroundColor: colors.border }]} />
      <View style={mS.item}>
        <Text style={[mS.val, { color: colors.text }]}>{fat}г</Text>
        <Text style={[mS.lbl, { color: colors.textTertiary }]}>Мазнини</Text>
      </View>
      <View style={[mS.div, { backgroundColor: colors.border }]} />
      <View style={mS.item}>
        <Text style={[mS.val, { color: colors.primary }]}>~{calories}</Text>
        <Text style={[mS.lbl, { color: colors.textTertiary }]}>ккал</Text>
      </View>
    </View>
  );
}

const mS = StyleSheet.create({
  bar: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  item: { flex: 1, alignItems: 'center' },
  val: { fontSize: 16, fontWeight: '700' },
  lbl: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  div: { width: 1, height: 32 },
});

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ recipe, slotColor, visible, onClose, onYouTube, colors }) {
  if (!recipe) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[rmS.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[rmS.closeBtn, { backgroundColor: colors.cardAlt }]} onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[rmS.title, { color: colors.text }]} numberOfLines={2}>{recipe.title}</Text>
          <TouchableOpacity style={rmS.ytBtn} onPress={onYouTube}>
            <Ionicons name="logo-youtube" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <View style={[rmS.chip, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[rmS.chipText, { color: colors.primary }]}>{recipe.prepTime} мин</Text>
            </View>
            <View style={[rmS.chip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[rmS.chipText, { color: colors.primary }]}>🔥 {recipe.calories} ккал</Text>
            </View>
            <View style={[rmS.chip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[rmS.chipText, { color: colors.primary }]}>💪 {recipe.protein}г</Text>
            </View>
          </View>

          <Text style={[rmS.desc, { backgroundColor: colors.orangeLight, color: colors.text }]}>{recipe.desc}</Text>

          {recipe.fromList?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={[rmS.sectionTitle, { color: colors.text }]}>✓ От вашия списък</Text>
              {recipe.fromList.map((ing, i) => (
                <View key={i} style={rmS.ingRow}>
                  <View style={[rmS.dot, { backgroundColor: slotColor }]} />
                  <Text style={[rmS.ingText, { color: colors.text }]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {recipe.extra?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={[rmS.sectionTitle, { color: colors.orange }]}>🛒 Допълнително нужни</Text>
              {recipe.extra.map((ing, i) => (
                <View key={i} style={rmS.ingRow}>
                  <View style={[rmS.dot, { backgroundColor: colors.orange }]} />
                  <Text style={[rmS.ingText, { color: colors.text }]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginBottom: 20 }}>
            <Text style={[rmS.sectionTitle, { color: colors.text }]}>📋 Приготвяне</Text>
            {recipe.steps?.map((step, i) => (
              <View key={i} style={rmS.stepRow}>
                <View style={[rmS.stepNum, { backgroundColor: slotColor }]}>
                  <Text style={rmS.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[rmS.stepText, { color: colors.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const rmS = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  ytBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF0000', justifyContent: 'center', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
  desc: { fontSize: 14, lineHeight: 21, borderRadius: 10, padding: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  ingText: { fontSize: 14, flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealsScreen({ route }) {
  const { colors, isDark } = useTheme();
  const { show: showToast } = useToast();
  const { lists } = useBudgetLists();

  // Meals tab can receive list from navigation params OR use latest saved list
  const paramList = route.params?.list;
  const latestList = useMemo(() => lists[0]?.items || [], [lists]);
  const allProducts = paramList || latestList;

  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [filters, setFilters] = useState({ vegetarian: false, quick: false, highProtein: false });
  const [excludedBySlot, setExcludedBySlot] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { isTablet } = useLayout();
  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const loadPlan = useCallback(async (currentFilters) => {
    setPlan(null);
    setPlanError(false);
    try {
      if (hasApiKey()) {
        const result = await generateMealPlan(allProducts, currentFilters);
        setPlan(result);
      } else {
        setPlan(FALLBACK);
      }
    } catch (err) {
      setPlan(FALLBACK);
      setPlanError(true);
    }
  }, [allProducts]);

  useEffect(() => {
    loadPlan(filters);
  }, []);

  const totals = useMemo(() => {
    if (!plan) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    return MEAL_SLOTS.reduce((acc, { key }) => {
      const r = plan[key];
      if (!r) return acc;
      return { protein: acc.protein + (r.protein || 0), carbs: acc.carbs + (r.carbs || 0), fat: acc.fat + (r.fat || 0), calories: acc.calories + (r.calories || 0) };
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });
  }, [plan]);

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
    const excluded = [...(excludedBySlot[slotKey] ?? []), ...(currentTitle ? [currentTitle] : [])];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingSlot(slotKey);
    try {
      const recipe = hasApiKey()
        ? await generateSingleMeal(allProducts, slotKey, excluded, filters)
        : FALLBACK[slotKey];
      setPlan((prev) => ({ ...prev, [slotKey]: recipe }));
      setExcludedBySlot((prev) => ({ ...prev, [slotKey]: excluded }));
    } catch {
      showToast('Неуспешна замяна на рецептата', 'error');
    } finally {
      setLoadingSlot(null);
    }
  }, [plan, excludedBySlot, allProducts, filters]);

  const openRecipe = useCallback((slotKey) => {
    Haptics.selectionAsync();
    setSelectedSlot(slotKey);
  }, []);

  const selectedSlotMeta = MEAL_SLOTS.find((sl) => sl.key === selectedSlot);
  const selectedRecipe = selectedSlot ? plan?.[selectedSlot] : null;

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Идеи за ястия 🍽️</Text>
          <Text style={s.headerSub}>
            {hasApiKey() ? 'Генерирано от AI по вашите продукти' : 'Примерни рецепти'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.regenBtn, !plan && { backgroundColor: colors.cardAlt }]}
          onPress={regenerateAll}
          disabled={!plan}
          accessibilityLabel="Обнови всички рецепти"
          accessibilityRole="button"
        >
          <Ionicons name="shuffle-outline" size={18} color={plan ? colors.primary : colors.textQuaternary} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(({ key, label, icon }) => {
          const active = filters[key];
          return (
            <TouchableOpacity
              key={key}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => toggleFilter(key)}
              activeOpacity={0.8}
              disabled={!plan}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={label}
            >
              <Text style={{ fontSize: 12 }}>{icon}</Text>
              <Text style={[s.filterChipText, active && { color: '#fff' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        {planError && (
          <View style={[s.fallbackBadge, { backgroundColor: colors.orangeLight, borderColor: colors.orange }]}>
            <Ionicons name="warning-outline" size={12} color={colors.orange} />
            <Text style={[s.fallbackText, { color: colors.orange }]}>Примерни рецепти</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Macros bar */}
        {plan && (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.sectionLabel}>Дневни макронутриенти</Text>
            <MacroBar {...totals} colors={colors} />
          </View>
        )}

        {/* Recipe cards */}
        <Text style={s.sectionLabel}>Дневен план</Text>

        {MEAL_SLOTS.map(({ key, label, icon, colorKey }, idx) => {
          const color = colors[colorKey];
          const recipe = plan?.[key];
          const isLoading = !plan || loadingSlot === key;

          if (isLoading) return <RecipeCardSkeleton key={key} />;

          return (
            <FadeInView key={`${key}-${recipe.title}`} delay={idx * 60} style={s.card}>

              <View style={s.cardTopRow}>
                <View style={[s.badge, { backgroundColor: color }]}>
                  <Text style={{ fontSize: 13 }}>{icon}</Text>
                  <Text style={s.badgeLabel}>{label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.timeBadge, { backgroundColor: colors.cardAlt }]}>
                    <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
                    <Text style={[s.timeText, { color: colors.textTertiary }]}>{recipe.prepTime} мин</Text>
                  </View>
                  <View style={[s.calChip, { borderColor: color }]}>
                    <Text style={[s.calChipText, { color }]}>{recipe.calories} ккал</Text>
                  </View>
                  <TouchableOpacity style={[s.swapBtn, { backgroundColor: colors.primaryLight }]} onPress={() => swapMeal(key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={`Смени рецептата за ${label}`} accessibilityRole="button">
                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[s.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>

              {recipe.fromList?.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={[s.fromLabel, { color: colors.green }]}>✓ От вашия списък:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {recipe.fromList.slice(0, 4).map((name, i) => (
                      <View key={i} style={[s.pill, { borderColor: color }]}>
                        <Text style={[s.pillText, { color }]}>{cleanName(name)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {recipe.extra?.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={[s.fromLabel, { color: colors.orange }]}>🛒 Допълнително:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {recipe.extra.slice(0, 3).map((name, i) => (
                      <View key={i} style={[s.pill, { borderColor: colors.orange, backgroundColor: colors.orangeLight }]}>
                        <Text style={[s.pillText, { color: colors.orange }]}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={[s.descBox, { backgroundColor: colors.orangeLight }]}>
                <Text style={[s.descText, { color: colors.text }]}>{recipe.desc}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[s.linkBtn, { backgroundColor: color }]} onPress={() => openRecipe(key)} activeOpacity={0.85}>
                  <Ionicons name="book-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={s.linkBtnText}>Виж рецепта</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.ytBtn} onPress={() => Linking.openURL(youtubeUrl(recipe.title)).catch(() => {})} activeOpacity={0.85}>
                  <Ionicons name="logo-youtube" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={s.linkBtnText}>YouTube</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      <RecipeModal
        visible={!!selectedSlot && !!selectedRecipe}
        recipe={selectedRecipe}
        slotColor={selectedSlotMeta ? colors[selectedSlotMeta.colorKey] : colors.primary}
        onClose={() => setSelectedSlot(null)}
        onYouTube={() => Linking.openURL(youtubeUrl(selectedRecipe?.title ?? '')).catch(() => {})}
        colors={colors}
      />
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },

    header: { backgroundColor: c.card, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 2 },
    headerSub: { fontSize: 12, color: c.textTertiary },
    regenBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
    filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    fallbackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
    fallbackText: { fontSize: 11, fontWeight: '600' },

    scroll: { padding: 16, maxWidth: isTablet ? 720 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: c.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: c.borderLight, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 2 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5 },
    badgeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
    timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
    timeText: { fontSize: 11, fontWeight: '600' },
    calChip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    calChipText: { fontSize: 12, fontWeight: '600' },
    swapBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

    recipeTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, lineHeight: 23 },
    fromLabel: { fontSize: 11, fontWeight: '600', marginBottom: 7 },
    pill: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    pillText: { fontSize: 12, fontWeight: '600' },
    descBox: { borderRadius: 10, padding: 12, marginBottom: 12 },
    descText: { fontSize: 13, lineHeight: 20 },
    linkBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    ytBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, backgroundColor: '#FF0000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  });
}
