import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const CATEGORY_ICONS = {
  meat: '🥩', dairy: '🥛', vegetables: '🥦', fruit: '🍎',
  grains: '🌾', snacks: '🍪', drinks: '🥤', fish: '🐟',
  eggs: '🥚', legumes: '🫘', bakery: '🍞', frozen: '🧊',
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

/**
 * Build a full day meal plan from available product categories.
 * Returns { breakfast, lunch, dinner, snack? }
 */
function buildMealPlan(list, goal) {
  const byCategory = {};
  list.forEach((item) => {
    const cat = item.category?.toLowerCase() || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  const has = (cat) => !!byCategory[cat]?.length;
  const names = (cats) =>
    cats
      .flatMap((c) => byCategory[c] || [])
      .map((i) => i.name)
      .filter(Boolean)
      .join(', ') || '—';

  const plan = { breakfast: null, lunch: null, dinner: null, snack: null };

  // ── Закуска ──
  if (has('eggs') && has('dairy')) {
    plan.breakfast = {
      name: 'Бъркани яйца с кисело мляко',
      icon: '🍳',
      kcal: '280 ккал',
      time: '10 мин',
      ingredients: names(['eggs', 'dairy']),
      tip: 'Добавете малко сол и черен пипер.',
    };
  } else if (has('grains')) {
    plan.breakfast = {
      name: 'Овесена каша с плодове',
      icon: '🥣',
      kcal: '320 ккал',
      time: '5 мин',
      ingredients: names(['grains', 'fruit', 'dairy']),
      tip: 'Може да добавите мед за вкус.',
    };
  } else if (has('bakery') && has('dairy')) {
    plan.breakfast = {
      name: 'Хляб с извара',
      icon: '🍞',
      kcal: '250 ккал',
      time: '5 мин',
      ingredients: names(['bakery', 'dairy']),
      tip: 'Добавете пресни зеленчуци за баланс.',
    };
  } else if (has('fruit')) {
    plan.breakfast = {
      name: 'Плодова чиния',
      icon: '🍎',
      kcal: '150 ккал',
      time: '3 мин',
      ingredients: names(['fruit']),
      tip: 'Лека и свежа закуска.',
    };
  }

  // ── Обяд ──
  if (has('meat') && has('vegetables')) {
    plan.lunch = {
      name: 'Пилешко с зеленчуци на фурна',
      icon: '🍗',
      kcal: '480 ккал',
      time: '40 мин',
      ingredients: names(['meat', 'vegetables', 'grains']),
      tip: 'Печете на 200°C. Полейте с зехтин.',
    };
  } else if (has('fish')) {
    plan.lunch = {
      name: 'Риба с гарнитура',
      icon: '🐟',
      kcal: '380 ккал',
      time: '25 мин',
      ingredients: names(['fish', 'vegetables', 'grains']),
      tip: 'Поднесете с лимон и зелени подправки.',
    };
  } else if (has('legumes') || has('vegetables')) {
    plan.lunch = {
      name: 'Зеленчукова яхния',
      icon: '🥘',
      kcal: '290 ккал',
      time: '30 мин',
      ingredients: names(['legumes', 'vegetables', 'grains']),
      tip: 'Добавете подправки на вкус.',
    };
  } else if (has('eggs')) {
    plan.lunch = {
      name: 'Омлет с хляб',
      icon: '🥚',
      kcal: '310 ккал',
      time: '15 мин',
      ingredients: names(['eggs', 'bakery', 'vegetables']),
      tip: 'Бърза и засищаща алтернатива.',
    };
  }

  // ── Вечеря ──
  if (has('meat') && has('grains')) {
    plan.dinner = {
      name: 'Кайма с ориз',
      icon: '🍚',
      kcal: '520 ккал',
      time: '30 мин',
      ingredients: names(['meat', 'grains', 'vegetables']),
      tip: 'Класическа и лесна вечеря.',
    };
  } else if (has('dairy') && has('vegetables')) {
    plan.dinner = {
      name: 'Салата с кисело мляко',
      icon: '🥗',
      kcal: '210 ккал',
      time: '10 мин',
      ingredients: names(['dairy', 'vegetables', 'fruit']),
      tip: 'Лека вечеря, богата на пробиотики.',
    };
  } else if (has('eggs')) {
    plan.dinner = {
      name: 'Бъркани яйца с зеленчуци',
      icon: '🍳',
      kcal: '280 ккал',
      time: '15 мин',
      ingredients: names(['eggs', 'vegetables']),
      tip: 'Бърза и лека вечеря.',
    };
  } else if (has('fish')) {
    plan.dinner = {
      name: 'Лека рибна чиния',
      icon: '🐟',
      kcal: '300 ккал',
      time: '20 мин',
      ingredients: names(['fish', 'vegetables']),
      tip: 'Идеална за лека вечеря.',
    };
  }

  // ── Снак ──
  if (goal === 'high_protein') {
    const proteinItems = list.filter((i) => (i.protein || 0) >= 10).map((i) => i.name).join(', ');
    if (proteinItems) {
      plan.snack = {
        name: 'Протеинов снак',
        icon: '💪',
        kcal: '200 ккал',
        time: '2 мин',
        ingredients: proteinItems,
        tip: 'Консумирайте след тренировка.',
      };
    }
  } else if (has('fruit') || has('dairy')) {
    plan.snack = {
      name: 'Плод или кисело мляко',
      icon: '🍌',
      kcal: '120 ккал',
      time: '1 мин',
      ingredients: names(['fruit', 'dairy']),
      tip: 'Здравословен снак между храненията.',
    };
  }

  return plan;
}

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

export default function MealsScreen({ route, navigation }) {
  const { list, goal } = route.params;
  const plan = buildMealPlan(list, goal);

  const totalKcal = MEAL_SLOTS.reduce((sum, slot) => {
    const meal = plan[slot.key];
    if (!meal) return sum;
    const n = parseInt(meal.kcal);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Дневен план, базиран на вашия списък</Text>
        <View style={styles.kcalBadge}>
          <Text style={styles.kcalText}>🔥 ~{totalKcal} ккал общо</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Ingredient chips from list ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Вашите продукти</Text>
          <View style={styles.chipsRow}>
            {list.map((item) => (
              <View key={item.id} style={styles.chip}>
                <Text style={styles.chipIcon}>{getCategoryIcon(item.category)}</Text>
                <Text style={styles.chipText}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Meal plan ── */}
        <Text style={styles.sectionLabel} >Дневен план</Text>
        {MEAL_SLOTS.map((slot) => {
          const meal = plan[slot.key];
          if (!meal) return null;
          return (
            <View key={slot.key} style={[styles.mealCard, { borderLeftColor: slot.color }]}>
              <View style={styles.mealCardHeader}>
                <View style={[styles.slotBadge, { backgroundColor: slot.color }]}>
                  <Text style={styles.slotIcon}>{slot.icon}</Text>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                </View>
                <View style={styles.mealMeta}>
                  <Text style={styles.mealMetaText}>⏱ {meal.time}</Text>
                  <Text style={styles.mealMetaText}>🔥 {meal.kcal}</Text>
                </View>
              </View>

              <View style={styles.mealNameRow}>
                <Text style={styles.mealIcon}>{meal.icon}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
              </View>

              <View style={styles.ingredientsBox}>
                <Text style={styles.ingredientsLabel}>Съставки:</Text>
                <Text style={styles.ingredientsText}>{meal.ingredients}</Text>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {meal.tip}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Обратно</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>🏠 Начало</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  /* Header */
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#999', marginBottom: 10 },
  kcalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  kcalText: { color: '#f39c12', fontWeight: '700', fontSize: 13 },

  scroll: { padding: 16 },

  /* Ingredient chips */
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#444' },

  /* Meal cards */
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  slotIcon: { fontSize: 13 },
  slotLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  mealMeta: { alignItems: 'flex-end', gap: 3 },
  mealMetaText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  mealNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  mealIcon: { fontSize: 30 },
  mealName: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', flex: 1 },

  ingredientsBox: {
    backgroundColor: '#F7F8FC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  ingredientsLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', marginBottom: 3 },
  ingredientsText: { fontSize: 13, color: '#555', lineHeight: 18 },

  tipBox: {
    backgroundColor: '#FFFBEA',
    borderRadius: 10,
    padding: 10,
  },
  tipText: { fontSize: 12, color: '#b7950b', fontWeight: '600' },

  /* Footer */
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#F0EEFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
