import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Text from '../components/Text';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../hooks/useLayout';
import { generateMealPlan, generateSingleMeal, hasApiKey } from '../services/mealAI';
import { getCategoryIcon } from '../utils/ui';
import { RADIUS, SPACING } from '../theme';
import AnimatedPressable from '../components/AnimatedPressable';

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: 'sunny-outline' },
  { key: 'lunch',     label: 'Обяд',    icon: 'restaurant-outline' },
  { key: 'dinner',    label: 'Вечеря',  icon: 'moon-outline' },
  { key: 'snack',     label: 'Снак',    icon: 'fast-food-outline' },
];

export default function MealsScreen({ navigation, route }) {
  const products = route.params?.products || [];
  const { colors, isDark, shadows } = useTheme();
  const { show: showToast } = useToast();
  const { isTablet } = useLayout();

  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filters, setFilters] = useState({
    vegetarian: false,
    quick: false,
    highProtein: false,
  });

  const hasKey = hasApiKey();

  const handleGeneratePlan = async () => {
    if (!hasKey) {
      showToast('Липсва API ключ за Claude', 'error');
      return;
    }
    if (products.length === 0) {
      showToast('Списъкът с продукти е празен', 'info');
      return;
    }

    setLoading(true);
    setStreaming(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const plan = await generateMealPlan(products, filters);
      setMealPlan(plan);
      showToast('Менюто е готово!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Грешка при генериране', 'error');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleRegenerateMeal = async (slotKey) => {
    if (loading) return;
    setLoading(true);
    try {
      const exclude = mealPlan ? [mealPlan[slotKey].title] : [];
      const newMeal = await generateSingleMeal(products, slotKey, exclude, filters);
      setMealPlan(prev => ({ ...prev, [slotKey]: newMeal }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      showToast('Грешка при обновяване', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderFilterPill = (key, label) => {
    const active = filters[key];
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.filterPill,
          { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border },
          active && shadows.sm
        ]}
        onPress={() => toggleFilter(key)}
      >
        <Text style={{ 
          fontSize: 13, 
          fontWeight: '600', 
          color: active ? '#fff' : colors.textSecondary 
        }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMealCard = (slot) => {
    const meal = mealPlan?.[slot.key];
    if (!meal) return null;

    return (
      <Animated.View 
        key={slot.key}
        entering={FadeInDown.delay(200)}
        layout={Layout.springify()}
        style={[styles.mealCard, { backgroundColor: colors.card }, shadows.md]}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Ionicons name={slot.icon} size={18} color={colors.primary} />
            <Text style={[styles.mealSlotLabel, { color: colors.primary }]}>{slot.label}</Text>
          </View>
          <TouchableOpacity onPress={() => handleRegenerateMeal(slot.key)} disabled={loading}>
            <Ionicons name="refresh-outline" size={20} color={colors.textQuaternary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setSelectedSlot(slot.key)}>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{meal.title}</Text>
          <Text style={[styles.mealDesc, { color: colors.textSecondary }]} numberOfLines={2}>{meal.desc}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{meal.prepTime} мин</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="flame-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{meal.calories} ккал</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Кулинарен Асистент</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!mealPlan && !loading && (
          <Animated.View entering={FadeInDown} style={styles.emptyState}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Генерирай меню за деня</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Claude ще анализира продуктите в списъка ти и ще предложи 4 балансирани рецепти.
            </Text>
          </Animated.View>
        )}

        <View style={styles.filtersContainer}>
          {renderFilterPill('vegetarian', 'Вегетарианско')}
          {renderFilterPill('quick', 'Бързо (<25м)')}
          {renderFilterPill('highProtein', 'Протеиново')}
        </View>

        {loading && !mealPlan && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {streaming ? 'Claude мисли върху рецептите...' : 'Генериране...'}
            </Text>
          </View>
        )}

        {mealPlan && (
          <View style={styles.mealGrid}>
            {MEAL_SLOTS.map(renderMealCard)}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <AnimatedPressable
          style={[styles.generateButton, { backgroundColor: colors.primary }, shadows.primary]}
          onPress={handleGeneratePlan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>
                {mealPlan ? 'Генерирай ново меню' : 'Генерирай меню'}
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      {/* Meal Detail Modal */}
      <Modal
        visible={!!selectedSlot}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {mealPlan?.[selectedSlot]?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedSlot(null)}>
                <Ionicons name="close-circle" size={30} color={colors.textQuaternary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Необходими продукти</Text>
              <View style={styles.ingredientsList}>
                {mealPlan?.[selectedSlot]?.fromList.map((item, idx) => (
                  <View key={`in-${idx}`} style={styles.ingredientItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                    <Text style={[styles.ingredientText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
                {mealPlan?.[selectedSlot]?.extra.map((item, idx) => (
                  <View key={`ex-${idx}`} style={styles.ingredientItem}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.orange} />
                    <Text style={[styles.ingredientText, { color: colors.text }]}>{item} (липсва)</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 20 }]}>Начин на приготвяне</Text>
              {mealPlan?.[selectedSlot]?.steps.map((step, idx) => (
                <View key={`step-${idx}`} style={styles.stepItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}

              <View style={[styles.nutritionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionVal, { color: colors.text }]}>{mealPlan?.[selectedSlot]?.protein}г</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>Протеин</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionVal, { color: colors.text }]}>{mealPlan?.[selectedSlot]?.carbs}г</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>Въглехидрати</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionVal, { color: colors.text }]}>{mealPlan?.[selectedSlot]?.fat}г</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>Мазнини</Text>
                </View>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backButton: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  filtersContainer: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterPill: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  loadingContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  mealGrid: { gap: 16 },
  mealCard: { 
    borderRadius: RADIUS.lg, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  mealHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10 
  },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealSlotLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  mealDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    borderTopWidth: 1, 
    backgroundColor: 'transparent' 
  },
  generateButton: { 
    height: 56, 
    borderRadius: RADIUS.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    height: '85%', 
    borderTopLeftRadius: RADIUS.xxl, 
    borderTopRightRadius: RADIUS.xxl,
    padding: 20
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 22, fontWeight: '800', flex: 1, marginRight: 10 },
  modalScroll: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ingredientsList: { gap: 8 },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingredientText: { fontSize: 15, fontWeight: '500' },
  stepItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNumber: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  nutritionCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 16, 
    borderRadius: RADIUS.md, 
    marginTop: 24,
    borderWidth: 1
  },
  nutritionItem: { alignItems: 'center' },
  nutritionVal: { fontSize: 16, fontWeight: '700' },
  nutritionLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 }
});
