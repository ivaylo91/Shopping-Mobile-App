import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';

const CATEGORY_ICONS = {
  meat: '🥩', dairy: '🥛', vegetables: '🥦', fruit: '🍎',
  grains: '🌾', snacks: '🍪', drinks: '🥤', fish: '🐟',
  eggs: '🥚', legumes: '🫘', bakery: '🍞', frozen: '🧊',
  protein: '💪', organic: '🌿', oils: '🫙', canned: '🥫',
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

// Real Bulgarian recipes, matched by product category priority.
// searchTerm is used to build a gotvach.bg search link.
const BG_RECIPES = [
  // ── ЗАКУСКА ──
  {
    slot: 'breakfast',
    name: 'Баница с яйца и сирене',
    cats: ['eggs', 'dairy'],
    kcal: '350 ккал',
    time: '40 мин',
    tip: 'Разбийте яйцата, натрошете сиренето и наредете с кори. Печете на 180°C до зачервяване.',
    search: 'баница яйца сирене',
  },
  {
    slot: 'breakfast',
    name: 'Тутманик',
    cats: ['dairy', 'bakery'],
    kcal: '280 ккал',
    time: '50 мин',
    tip: 'Замесете тесто с кисело мляко и масло, добавете сирене и изпечете.',
    search: 'тутманик',
  },
  {
    slot: 'breakfast',
    name: 'Кисело мляко с мед',
    cats: ['dairy'],
    kcal: '180 ккал',
    time: '2 мин',
    tip: 'Изсипете кисело мляко в купичка, добавете мед и орехи по желание.',
    search: 'кисело мляко мед орехи',
  },
  {
    slot: 'breakfast',
    name: 'Овесена каша с пресни плодове',
    cats: ['grains', 'fruit'],
    kcal: '310 ккал',
    time: '10 мин',
    tip: 'Сварете овесените ядки с мляко, добавете нарязани плодове и мед.',
    search: 'овесена каша плодове',
  },
  {
    slot: 'breakfast',
    name: 'Скир с плодове',
    cats: ['protein', 'dairy', 'fruit'],
    kcal: '160 ккал',
    time: '2 мин',
    tip: 'Изсипете скира в купичка, наредете нарязани плодове отгоре.',
    search: 'скир плодове закуска',
  },

  // ── ОБЯД ──
  {
    slot: 'lunch',
    name: 'Пилешка супа с зеленчуци',
    cats: ['meat', 'vegetables'],
    kcal: '280 ккал',
    time: '50 мин',
    tip: 'Сварете пилешкото с моркови, целина и лук. Добавете фиде и магданоз накрая.',
    search: 'пилешка супа зеленчуци',
  },
  {
    slot: 'lunch',
    name: 'Мусака',
    cats: ['meat', 'vegetables'],
    kcal: '480 ккал',
    time: '70 мин',
    tip: 'Запържете кайма с лук, наредете с картофи на пластове и залейте с яйца и мляко.',
    search: 'мусака рецепта',
  },
  {
    slot: 'lunch',
    name: 'Шопска салата',
    cats: ['vegetables', 'dairy'],
    kcal: '180 ккал',
    time: '10 мин',
    tip: 'Нарежете домати, краставици и чушки. Добавете маслини и поръсете с настъргано сирене.',
    search: 'шопска салата',
  },
  {
    slot: 'lunch',
    name: 'Таратор',
    cats: ['dairy', 'vegetables'],
    kcal: '140 ккал',
    time: '10 мин',
    tip: 'Разредете кисело мляко с вода, добавете настъргана краставица, чесън и копър.',
    search: 'таратор рецепта',
  },
  {
    slot: 'lunch',
    name: 'Рибена чорба',
    cats: ['fish', 'vegetables'],
    kcal: '220 ккал',
    time: '40 мин',
    tip: 'Сварете рибата с домати, лук и моркови. Подправете с магданоз и лимон.',
    search: 'рибена чорба рецепта',
  },
  {
    slot: 'lunch',
    name: 'Гювеч с месо и зеленчуци',
    cats: ['meat', 'vegetables'],
    kcal: '430 ккал',
    time: '70 мин',
    tip: 'Запържете месото, добавете нарязани зеленчуци и изпечете в тава на 180°C.',
    search: 'гювеч месо зеленчуци',
  },
  {
    slot: 'lunch',
    name: 'Боб чорба',
    cats: ['legumes', 'vegetables'],
    kcal: '300 ккал',
    time: '90 мин',
    tip: 'Накиснете боба от предната вечер. Сварете с лук, морков и подправки. Добавете джоджен.',
    search: 'боб чорба рецепта',
  },

  // ── ВЕЧЕРЯ ──
  {
    slot: 'dinner',
    name: 'Кебапчета на скара',
    cats: ['meat'],
    kcal: '380 ккал',
    time: '20 мин',
    tip: 'Смесете каймата с подправки, оформете кебапчета и изпечете на загрята скара.',
    search: 'кебапчета скара рецепта',
  },
  {
    slot: 'dinner',
    name: 'Пълнени чушки с кайма и ориз',
    cats: ['meat', 'vegetables'],
    kcal: '450 ккал',
    time: '60 мин',
    tip: 'Напълнете чушките с кайма, ориз и подправки. Залейте с доматен сос и изпечете.',
    search: 'пълнени чушки кайма ориз',
  },
  {
    slot: 'dinner',
    name: 'Риба на фурна с лимон',
    cats: ['fish'],
    kcal: '290 ккал',
    time: '35 мин',
    tip: 'Наредете рибата в тава, полейте с лимонов сок и зехтин. Печете на 200°C.',
    search: 'риба фурна лимон',
  },
  {
    slot: 'dinner',
    name: 'Картофена мусака с яйца',
    cats: ['eggs', 'vegetables'],
    kcal: '370 ккал',
    time: '50 мин',
    tip: 'Наредете варени картофи, залейте с разбити яйца и кисело мляко. Изпечете до зачервяване.',
    search: 'картофена мусака яйца',
  },
  {
    slot: 'dinner',
    name: 'Леща яхния',
    cats: ['legumes', 'grains'],
    kcal: '320 ккал',
    time: '40 мин',
    tip: 'Задушете лук и моркови, добавете червена леща и варете 20 мин с подправки.',
    search: 'леща яхния рецепта',
  },
  {
    slot: 'dinner',
    name: 'Лека салата с кисело мляко',
    cats: ['dairy', 'vegetables'],
    kcal: '170 ккал',
    time: '10 мин',
    tip: 'Нарежете краставица и домати, залейте с кисело мляко, чесън и сол.',
    search: 'салата кисело мляко краставица',
  },

  // ── СНАК ──
  {
    slot: 'snack',
    name: 'Кисело мляко с пресни плодове',
    cats: ['dairy', 'fruit'],
    kcal: '130 ккал',
    time: '2 мин',
    tip: 'Изсипете кисело мляко, наредете нарязани плодове и добавете малко мед.',
    search: 'кисело мляко плодове снак',
  },
  {
    slot: 'snack',
    name: 'Халва с бадеми',
    cats: ['snacks'],
    kcal: '200 ккал',
    time: '1 мин',
    tip: 'Нарежете халвата на малки парчета и поднесете с шепа бадеми.',
    search: 'халва бадеми',
  },
  {
    slot: 'snack',
    name: 'Плодова чиния',
    cats: ['fruit'],
    kcal: '100 ккал',
    time: '3 мин',
    tip: 'Нарежете сезонни плодове — ягоди, манго или грозде — и поднесете свежо.',
    search: 'плодова чиния рецепта',
  },
  {
    slot: 'snack',
    name: 'Протеинов йогурт с плодове',
    cats: ['protein'],
    kcal: '170 ккал',
    time: '2 мин',
    tip: 'Смесете протеинов йогурт с нарязани плодове за бърз снак след тренировка.',
    search: 'протеинов йогурт плодове',
  },
];

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

function buildPlan(list, goal) {
  const byCategory = {};
  list.forEach((item) => {
    const cat = item.category?.toLowerCase() || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  const plan = {};

  for (const slot of MEAL_SLOTS) {
    // Find all recipes for this slot
    const candidates = BG_RECIPES.filter((r) => r.slot === slot.key);

    // Score each recipe by how many of its cats are present in the user's list
    const scored = candidates
      .map((r) => ({
        recipe: r,
        score: r.cats.filter((c) => byCategory[c]?.length).length,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // high_protein goal: boost protein-cat recipes for snack slot
    if (goal === 'high_protein' && slot.key === 'snack') {
      const hiPro = candidates.find((r) => r.cats.includes('protein') && byCategory['protein']?.length);
      if (hiPro) { plan[slot.key] = hiPro; continue; }
    }

    if (!scored.length) continue;

    const chosen = scored[0].recipe;

    // Pick up to 3 matching products from the user's list to show as ingredients
    const matchedProducts = chosen.cats
      .flatMap((c) => byCategory[c] || [])
      .slice(0, 3)
      .map((p) => p.name);

    plan[slot.key] = { ...chosen, matchedProducts };
  }

  return plan;
}

export default function MealsScreen({ route, navigation }) {
  const { list, goal } = route.params;
  const plan = buildPlan(list, goal);

  const totalKcal = MEAL_SLOTS.reduce((sum, slot) => {
    const meal = plan[slot.key];
    if (!meal) return sum;
    return sum + (parseInt(meal.kcal) || 0);
  }, 0);

  const openRecipe = (searchTerm) => {
    const url = `https://gotvach.bg/search?term=${encodeURIComponent(searchTerm)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Български рецепти по вашия списък</Text>
        <View style={styles.kcalBadge}>
          <Text style={styles.kcalText}>🔥 ~{totalKcal} ккал общо</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product chips */}
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

        {/* Meal cards */}
        <Text style={styles.sectionLabel}>Дневен план</Text>

        {MEAL_SLOTS.map((slot) => {
          const meal = plan[slot.key];
          if (!meal) return null;
          return (
            <View key={slot.key} style={[styles.mealCard, { borderLeftColor: slot.color }]}>

              {/* Slot badge */}
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

              {/* Name */}
              <Text style={styles.mealName}>{meal.name}</Text>

              {/* Matched products from list */}
              <View style={styles.ingredientsBox}>
                <Text style={styles.ingredientsLabel}>Продукти от вашия списък:</Text>
                {meal.matchedProducts.map((p, i) => (
                  <Text key={i} style={styles.ingredientItem}>• {p}</Text>
                ))}
              </View>

              {/* Tip */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {meal.tip}</Text>
              </View>

              {/* Recipe link */}
              <TouchableOpacity
                style={[styles.linkBtn, { backgroundColor: slot.color }]}
                onPress={() => openRecipe(meal.search)}
              >
                <Text style={styles.linkBtnText}>📖 Виж рецептата в gotvach.bg</Text>
              </TouchableOpacity>

            </View>
          );
        })}

        {Object.keys(plan).length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Не намерихме подходящи рецепти. Добавете повече продукти в списъка си.
            </Text>
          </View>
        )}

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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

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

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#444' },

  mealCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  mealCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  slotBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5,
  },
  slotIcon: { fontSize: 13 },
  slotLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  mealMeta: { alignItems: 'flex-end', gap: 3 },
  mealMetaText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  mealName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },

  ingredientsBox: {
    backgroundColor: '#F7F8FC', borderRadius: 10, padding: 10, marginBottom: 10,
  },
  ingredientsLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', marginBottom: 4 },
  ingredientItem: { fontSize: 13, color: '#444', lineHeight: 22 },

  tipBox: {
    backgroundColor: '#FFFBEA', borderRadius: 10, padding: 10, marginBottom: 12,
  },
  tipText: { fontSize: 12, color: '#b7950b', fontWeight: '600', lineHeight: 18 },

  linkBtn: {
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyBox: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22 },

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
});
