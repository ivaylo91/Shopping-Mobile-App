import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
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

// Map a product to a TheMealDB ingredient search term (English)
function toSearchTerm(product) {
  if (!product) return null;
  const n = product.name.toLowerCase();

  if (n.includes('пилешк'))                          return 'chicken';
  if (n.includes('говежд') || n.includes('телешк') || n.includes('ръмп стек')) return 'beef';
  if (n.includes('свинск'))                          return 'pork';
  if (n.includes('сьомга'))                          return 'salmon';
  if (n.includes('риба тон'))                        return 'tuna';
  if (n.includes('скариди'))                         return 'shrimp';
  if (n.includes('миди'))                            return 'mussels';
  if (n.includes('калмари'))                         return 'squid';
  if (n.includes('спанак'))                          return 'spinach';
  if (n.includes('домат'))                           return 'tomatoes';
  if (n.includes('гъби') || n.includes('печурки'))   return 'mushrooms';
  if (n.includes('краставиц'))                       return 'cucumber';
  if (n.includes('яйц'))                             return 'eggs';
  if (n.includes('кисело мляко') || n.includes('йогурт') || n.includes('скир')) return 'yogurt';
  if (n.includes('сирен') || n.includes('фета') || n.includes('халуми') || n.includes('кашкавал')) return 'cheese';
  if (n.includes('паста') || n.includes('пене'))     return 'pasta';
  if (n.includes('леща'))                            return 'lentils';
  if (n.includes('боб'))                             return 'beans';
  if (n.includes('ягод'))                            return 'strawberries';
  if (n.includes('авокадо'))                         return 'avocado';
  if (n.includes('манго'))                           return 'mango';
  if (n.includes('бадем'))                           return 'almonds';
  if (n.includes('масло') && n.includes('маслин'))   return 'olive oil';

  const fallbacks = {
    meat: 'chicken', fish: 'salmon', dairy: 'cheese',
    vegetables: 'tomatoes', grains: 'pasta', eggs: 'eggs',
    fruit: 'strawberries', legumes: 'lentils', bakery: 'bread',
    snacks: 'almonds', protein: 'chicken', organic: 'spinach',
  };
  return fallbacks[product.category?.toLowerCase()] || 'chicken';
}

// Translate English ingredient name to Bulgarian
const ING_BG = {
  // Proteins
  'chicken': 'пиле', 'chicken breast': 'пилешки гърди', 'chicken thighs': 'пилешки бутчета',
  'chicken legs': 'пилешки крачета', 'chicken wings': 'пилешки крилца',
  'beef': 'говеждо', 'ground beef': 'говежда кайма', 'beef mince': 'говежда кайма',
  'steak': 'стек', 'pork': 'свинско', 'pork belly': 'свински корем',
  'bacon': 'бекон', 'ham': 'шунка', 'sausage': 'наденица', 'chorizo': 'чоризо',
  'lamb': 'агнешко', 'turkey': 'пуешко', 'duck': 'патешко',
  'salmon': 'сьомга', 'tuna': 'риба тон', 'shrimp': 'скариди', 'prawns': 'скариди',
  'mussels': 'миди', 'squid': 'калмари', 'cod': 'треска', 'sea bass': 'лаврак',
  'eggs': 'яйца', 'egg': 'яйце',
  // Dairy
  'cheese': 'сирене', 'parmesan': 'пармезан', 'mozzarella': 'моцарела',
  'feta': 'фета', 'cheddar': 'чедър', 'cream cheese': 'крем сирене',
  'ricotta': 'рикота', 'goat cheese': 'козе сирене',
  'milk': 'мляко', 'yogurt': 'кисело мляко', 'butter': 'масло',
  'cream': 'сметана', 'double cream': 'тежка сметана', 'sour cream': 'заквасена сметана',
  // Vegetables
  'tomatoes': 'домати', 'tomato': 'домат', 'cherry tomatoes': 'чери домати',
  'onion': 'лук', 'red onion': 'червен лук', 'spring onions': 'пресен лук',
  'garlic': 'чесън', 'garlic cloves': 'скилидки чесън',
  'spinach': 'спанак', 'mushrooms': 'гъби', 'mushroom': 'гъба',
  'pepper': 'пипер', 'bell pepper': 'чушка', 'red pepper': 'червена чушка',
  'green pepper': 'зелена чушка', 'yellow pepper': 'жълта чушка',
  'courgette': 'тиквичка', 'zucchini': 'тиквичка', 'aubergine': 'патладжан',
  'eggplant': 'патладжан', 'broccoli': 'броколи', 'cauliflower': 'карфиол',
  'carrot': 'морков', 'carrots': 'моркови', 'celery': 'целина',
  'cucumber': 'краставица', 'leek': 'праз лук', 'asparagus': 'аспержи',
  'peas': 'грах', 'sweetcorn': 'царевица', 'corn': 'царевица',
  'potato': 'картоф', 'potatoes': 'картофи', 'sweet potato': 'сладък картоф',
  'lettuce': 'маруля', 'rocket': 'рукола', 'kale': 'кейл',
  'olives': 'маслини', 'capers': 'каперси', 'artichoke': 'артишок',
  // Grains & Pasta
  'pasta': 'паста', 'spaghetti': 'спагети', 'penne': 'пене',
  'tagliatelle': 'талятеле', 'lasagne sheets': 'листи за лазаня',
  'rice': 'ориз', 'basmati rice': 'басмати ориз', 'risotto rice': 'ризото ориз',
  'bread': 'хляб', 'breadcrumbs': 'галета', 'flour': 'брашно',
  'plain flour': 'бяло брашно', 'self-raising flour': 'набухващо брашно',
  'oats': 'овесени ядки', 'couscous': 'кус-кус', 'quinoa': 'киноа',
  'lentils': 'леща', 'red lentils': 'червена леща', 'green lentils': 'зелена леща',
  'beans': 'боб', 'chickpeas': 'нахут', 'kidney beans': 'фасул',
  'black beans': 'черен боб',
  // Herbs & Spices
  'salt': 'сол', 'pepper': 'черен пипер', 'black pepper': 'черен пипер',
  'paprika': 'червен пипер', 'cumin': 'кимион', 'coriander': 'кориандър',
  'turmeric': 'куркума', 'oregano': 'риган', 'basil': 'босилек',
  'thyme': 'мащерка', 'rosemary': 'розмарин', 'parsley': 'магданоз',
  'bay leaves': 'дафинови листа', 'chilli': 'люта чушка', 'chili': 'чили',
  'chilli flakes': 'люспи чили', 'cayenne pepper': 'кайен',
  'cinnamon': 'канела', 'nutmeg': 'индийско орехче', 'ginger': 'джинджифил',
  'curry powder': 'къри', 'garam masala': 'гарам масала',
  // Sauces & Oils
  'olive oil': 'зехтин', 'vegetable oil': 'растително масло',
  'sunflower oil': 'слънчогледово масло', 'sesame oil': 'сусамово масло',
  'soy sauce': 'соев сос', 'worcestershire sauce': 'уорчестър сос',
  'tomato puree': 'доматено пюре', 'tomato paste': 'доматена паста',
  'passata': 'доматен сок', 'stock': 'бульон', 'chicken stock': 'пилешки бульон',
  'beef stock': 'телешки бульон', 'vegetable stock': 'зеленчуков бульон',
  'vinegar': 'оцет', 'balsamic vinegar': 'балсамов оцет',
  'lemon': 'лимон', 'lemon juice': 'лимонов сок', 'lime': 'лайм',
  'honey': 'мед', 'sugar': 'захар', 'brown sugar': 'кафява захар',
  'mustard': 'горчица', 'mayonnaise': 'майонеза', 'tahini': 'тахан',
  // Fruits & Nuts
  'strawberries': 'ягоди', 'blueberries': 'боровинки', 'raspberries': 'малини',
  'avocado': 'авокадо', 'mango': 'манго', 'banana': 'банан',
  'apple': 'ябълка', 'lemon zest': 'лимонова кора',
  'almonds': 'бадеми', 'walnuts': 'орехи', 'pine nuts': 'кедрови ядки',
  'cashews': 'кашу', 'peanuts': 'фъстъци', 'coconut milk': 'кокосово мляко',
  // Other
  'water': 'вода', 'white wine': 'бяло вино', 'red wine': 'червено вино',
  'stock cube': 'кубче бульон', 'egg yolks': 'жълтъци', 'egg whites': 'белтъци',
};

function translateIngredient(raw) {
  const lower = raw.toLowerCase().trim();
  // Try full match first
  if (ING_BG[lower]) return ING_BG[lower];
  // Try matching just the ingredient part (without measure)
  for (const [en, bg] of Object.entries(ING_BG)) {
    if (lower.endsWith(en) || lower.includes(` ${en}`)) return raw.replace(new RegExp(en, 'i'), bg);
  }
  return raw; // fallback: keep original if no translation found
}

// Fetch one recipe from TheMealDB by ingredient, return simplified object
async function fetchRecipe(ingredient) {
  try {
    const filterRes = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
    );
    const filterData = await filterRes.json();
    const meals = filterData.meals;
    if (!meals?.length) return null;

    // Pick randomly from first 5 results for variety
    const pick = meals[Math.floor(Math.random() * Math.min(meals.length, 5))];

    const detailRes = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${pick.idMeal}`
    );
    const detailData = await detailRes.json();
    const m = detailData.meals?.[0];
    if (!m) return null;

    // Collect up to 5 ingredients from the meal
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = m[`strIngredient${i}`];
      const meas = m[`strMeasure${i}`];
      if (ing?.trim()) ingredients.push(translateIngredient(`${meas?.trim() || ''} ${ing}`.trim()));
      if (ingredients.length >= 5) break;
    }

    return {
      name: m.strMeal,
      category: m.strCategory,
      area: m.strArea,
      instructions: m.strInstructions?.slice(0, 200) + '…',
      ingredients,
      url: m.strSource || `https://www.themealdb.com/meal/${m.idMeal}`,
      youtube: m.strYoutube || null,
      thumb: m.strMealThumb,
    };
  } catch {
    return null;
  }
}

// Slot definitions: which product categories to look for, in priority order
const MEAL_SLOTS = [
  {
    key: 'breakfast',
    label: 'Закуска',
    icon: '🌅',
    color: '#f39c12',
    cats: ['eggs', 'dairy', 'bakery', 'grains', 'fruit'],
  },
  {
    key: 'lunch',
    label: 'Обяд',
    icon: '☀️',
    color: '#6C63FF',
    cats: ['meat', 'fish', 'vegetables', 'legumes', 'grains'],
  },
  {
    key: 'dinner',
    label: 'Вечеря',
    icon: '🌙',
    color: '#2ecc71',
    cats: ['meat', 'fish', 'grains', 'dairy', 'vegetables'],
  },
  {
    key: 'snack',
    label: 'Снак',
    icon: '⚡',
    color: '#e74c3c',
    cats: ['fruit', 'snacks', 'dairy', 'protein'],
  },
];

export default function MealsScreen({ route, navigation }) {
  const { list, goal } = route.params;
  const [recipes, setRecipes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const byCategory = {};
      list.forEach((item) => {
        const cat = item.category?.toLowerCase() || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });

      const results = {};
      const usedIds = new Set(); // avoid duplicate recipes across slots

      for (const slot of MEAL_SLOTS) {
        // Find the first product matching this slot's preferred categories
        let product = null;
        for (const cat of slot.cats) {
          if (byCategory[cat]?.length) {
            // For dinner, prefer a different meat than lunch used
            const candidates = byCategory[cat];
            product = candidates.find((p) => !usedIds.has(p.id)) || candidates[0];
            break;
          }
        }

        if (!product) continue;

        // high_protein goal: override snack slot with a protein product
        if (goal === 'high_protein' && slot.key === 'snack') {
          const hiPro = list.find((i) => (i.protein || 0) >= 15 && !usedIds.has(i.id));
          if (hiPro) product = hiPro;
        }

        const term = toSearchTerm(product);
        if (!term) continue;

        const recipe = await fetchRecipe(term);
        if (recipe) {
          results[slot.key] = { ...recipe, sourceProduct: product.name };
          usedIds.add(product.id);
        }
      }

      setRecipes(results);
      setLoading(false);
    }

    load();
  }, []);

  const openLink = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Реални рецепти, базирани на вашия списък</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Търсим рецепти…</Text>
        </View>
      ) : (
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
            const recipe = recipes[slot.key];
            if (!recipe) return null;
            return (
              <View key={slot.key} style={[styles.mealCard, { borderLeftColor: slot.color }]}>

                {/* Slot badge + meta */}
                <View style={styles.mealCardHeader}>
                  <View style={[styles.slotBadge, { backgroundColor: slot.color }]}>
                    <Text style={styles.slotIcon}>{slot.icon}</Text>
                    <Text style={styles.slotLabel}>{slot.label}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    {recipe.area ? <Text style={styles.metaTag}>{recipe.area}</Text> : null}
                    {recipe.category ? <Text style={styles.metaTag}>{recipe.category}</Text> : null}
                  </View>
                </View>

                {/* Recipe name */}
                <Text style={styles.mealName}>{recipe.name}</Text>
                <Text style={styles.sourceProduct}>
                  На база: <Text style={{ fontWeight: '700' }}>{recipe.sourceProduct}</Text>
                </Text>

                {/* Ingredients */}
                <View style={styles.ingredientsBox}>
                  <Text style={styles.ingredientsLabel}>Съставки (основни):</Text>
                  {recipe.ingredients.map((ing, idx) => (
                    <Text key={idx} style={styles.ingredientItem}>• {ing}</Text>
                  ))}
                </View>

                {/* Instructions preview */}
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsLabel}>Приготвяне:</Text>
                  <Text style={styles.instructionsText}>{recipe.instructions}</Text>
                </View>

                {/* Links */}
                <View style={styles.linksRow}>
                  {recipe.url ? (
                    <TouchableOpacity
                      style={[styles.linkBtn, { backgroundColor: slot.color }]}
                      onPress={() => openLink(recipe.url)}
                    >
                      <Text style={styles.linkBtnText}>📖 Пълна рецепта</Text>
                    </TouchableOpacity>
                  ) : null}
                  {recipe.youtube ? (
                    <TouchableOpacity
                      style={[styles.linkBtn, { backgroundColor: '#e74c3c' }]}
                      onPress={() => openLink(recipe.youtube)}
                    >
                      <Text style={styles.linkBtnText}>▶ YouTube</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

              </View>
            );
          })}

          {Object.keys(recipes).length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Не намерихме рецепти за вашите продукти. Добавете повече продукти в списъка.</Text>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      )}

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
  headerSub: { fontSize: 13, color: '#999' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 15, color: '#888', marginTop: 8 },

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
  metaRow: { flexDirection: 'row', gap: 6 },
  metaTag: {
    backgroundColor: '#F0EEFF', color: '#6C63FF',
    fontSize: 11, fontWeight: '700', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },

  mealName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  sourceProduct: { fontSize: 12, color: '#aaa', marginBottom: 12 },

  ingredientsBox: {
    backgroundColor: '#F7F8FC', borderRadius: 10, padding: 10, marginBottom: 10,
  },
  ingredientsLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', marginBottom: 4 },
  ingredientItem: { fontSize: 13, color: '#444', lineHeight: 20 },

  instructionsBox: {
    backgroundColor: '#FFFBEA', borderRadius: 10, padding: 10, marginBottom: 12,
  },
  instructionsLabel: { fontSize: 11, color: '#b7950b', fontWeight: '700', marginBottom: 4 },
  instructionsText: { fontSize: 12, color: '#555', lineHeight: 18 },

  linksRow: { flexDirection: 'row', gap: 10 },
  linkBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 10,
    alignItems: 'center',
  },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

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
