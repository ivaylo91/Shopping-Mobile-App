import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Recipes with ingredient keys for matching ────────────────────────────────
// keys[] = Bulgarian word stems of main ingredients (4-6 chars, lowercase)
// Matching: product name token starts with key, or key starts with token

const RECIPES = {
  // Месо
  meat: [
    {
      title: 'Бързо пиле с аспержи на тиган',
      keys: ['пиле', 'пилешк', 'аспержи', 'масл'],
      url: 'https://recepti.gotvach.bg/r-289518-Бързо_пиле_с_аспержи_на_тиган',
      desc: 'Пилешкото филе се нарязва на малки хапки и се запържва в тиган с масло и подправки.',
    },
    {
      title: 'Свинско контрафиле на тиган с хрупкави аспержи',
      keys: ['свинск', 'контраф', 'аспержи'],
      url: 'https://recepti.gotvach.bg/r-289553-Свинско_контрафиле_на_тиган_с_хрупкави_аспержи',
      desc: 'Свинското контрафиле се изпича на тиган до хрупкава коричка и се поднася с аспержи.',
    },
    {
      title: 'Крехко телешко с лук и домати',
      keys: ['говежд', 'телешк', 'лук', 'домат'],
      url: 'https://recepti.gotvach.bg/r-289493-Крехко_телешко_с_лук_и_домати_(Swiss_Steak)',
      desc: 'Телешките пържоли се задушават с лук и домати до пълно омекване.',
    },
    {
      title: 'Ароматно свинско печено с картофи и зеленчуци',
      keys: ['свинск', 'картоф', 'морков', 'лук'],
      url: 'https://recepti.gotvach.bg/r-289479-Ароматно_свинско_печено_с_картофи_и_зеленчуци',
      desc: 'Свинско месо, печено на фурна с картофи, моркови и подправки на 190°C.',
    },
    {
      title: 'Агнешки джоланчета с картофи',
      keys: ['агнешк', 'джолан', 'картоф', 'лук'],
      url: 'https://recepti.gotvach.bg/r-288118-Агнешки_джоланчета_с_картофи',
      desc: 'Агнешки джолани, бавно изпечени с картофи и ароматни подправки.',
    },
    {
      title: 'Кайма с ориз и зеленчуци',
      keys: ['кайма', 'ориз', 'домат', 'чушк', 'лук'],
      url: 'https://recepti.gotvach.bg/r-288000-Кайма_с_ориз_и_зеленчуци',
      desc: 'Телешка или смесена кайма задушена с ориз, домати и чушки.',
    },
    {
      title: 'Пиле с картофи на фурна',
      keys: ['пиле', 'пилешк', 'картоф', 'лук'],
      url: 'https://recepti.gotvach.bg/r-287000-Пиле_с_картофи_на_фурна',
      desc: 'Класическо пиле с картофи, изпечено на фурна с масло и подправки.',
    },
  ],

  // Риба
  fish: [
    {
      title: 'Лека рибна запеканка за вечеря',
      keys: ['риба', 'рибн', 'рибно', 'лук', 'домат'],
      url: 'https://recepti.gotvach.bg/r-289340-Лека_рибна_запеканка_за_вечеря',
      desc: 'Рибно филе с хляб и зеленчуци, запечено на фурна за лека вечеря.',
    },
    {
      title: 'Сьомга със сос от синьо сирене и гъби',
      keys: ['сьомга', 'сирен', 'гъб', 'масл'],
      url: 'https://recepti.gotvach.bg/r-288255-Сьомга_със_сос_от_синьо_сирене_и_гъби',
      desc: 'Сьомга, изпечена на тиган и поднесена с кремообразен сос от сирене и гъби.',
    },
    {
      title: 'Скариди в чесново масло',
      keys: ['скарид', 'масл', 'чесън'],
      url: 'https://recepti.gotvach.bg/r-288260-Скариди_в_чесново_масло',
      desc: 'Скаридите се запържват в масло с чесън и магданоз — готово за 10 минути.',
    },
    {
      title: 'Кеджъри с пушена сьомга и ориз',
      keys: ['сьомга', 'ориз', 'яйц'],
      url: 'https://recepti.gotvach.bg/r-288256-Кеджъри_с_пушена_сьомга_и_ориз',
      desc: 'Класическо ястие с пушена сьомга, ориз и яйца — сити и ароматно.',
    },
    {
      title: 'Печена риба със зеленчуци',
      keys: ['риба', 'рибн', 'рибно', 'картоф', 'лук', 'домат'],
      url: 'https://recepti.gotvach.bg/r-288027-Печена_риба_със_зеленчуци_-_тип_пеперуда',
      desc: 'Цяла риба, разгъната като пеперуда и изпечена с пресни зеленчуци.',
    },
  ],

  // Супи
  soup: [
    {
      title: 'Перфектната крем супа от леща',
      keys: ['леща', 'лещен', 'морков', 'лук'],
      url: 'https://recepti.gotvach.bg/r-288374-Перфектната_крем_супа_от_леща',
      desc: 'Кадифена крем супа от червена леща с лук, морков и подправки.',
    },
    {
      title: 'Крем супа от спанак, батат и пащърнак',
      keys: ['спанак', 'батат', 'морков'],
      url: 'https://recepti.gotvach.bg/r-287955-Крем_супа_от_спанак,_батат_и_пащърнак',
      desc: 'Богата крем супа от спанак и сладки картофи — здравословна и засища.',
    },
    {
      title: 'Нежна крем супа с праз и гъби',
      keys: ['гъб', 'праз', 'лук', 'картоф'],
      url: 'https://recepti.gotvach.bg/r-287367-Нежна_крем_супа_с_праз_и_гъби',
      desc: 'Праз и гъби, задушени с масло и пасирани до копринена текстура.',
    },
    {
      title: 'Пилешка супа с фиде',
      keys: ['пиле', 'пилешк', 'морков', 'лук', 'целин'],
      url: 'https://recepti.gotvach.bg/r-286000-Пилешка_супа_с_фиде',
      desc: 'Домашна пилешка супа с моркови, лук и фиде — топла и засищаща.',
    },
    {
      title: 'Боб чорба по старобългарски',
      keys: ['боб', 'лук', 'морков', 'чушк', 'домат'],
      url: 'https://recepti.gotvach.bg/r-285000-Боб_чорба_по_старобългарски',
      desc: 'Традиционна боб чорба с морков, лук и чушки — класика на българската кухня.',
    },
    {
      title: 'Картофена супа с кашкавал',
      keys: ['картоф', 'сирен', 'кашкав', 'лук'],
      url: 'https://recepti.gotvach.bg/r-287000-Картофена_супа_с_кашкавал',
      desc: 'Гъста картофена супа с разтопен кашкавал и лук — сгряваща и вкусна.',
    },
  ],

  // Салати
  salad: [
    {
      title: 'Класическа яйчена салата с грах',
      keys: ['яйц', 'грах', 'майонез'],
      url: 'https://recepti.gotvach.bg/r-289505-Класическа_яйчена_салата_с_грах',
      desc: 'Твърдо сварени яйца, грах и майонеза — бърза и вкусна салата.',
    },
    {
      title: 'Салата с нахут, сирене и авокадо',
      keys: ['нахут', 'сирен', 'фета', 'домат', 'краставиц'],
      url: 'https://recepti.gotvach.bg/r-287964-Салата_с_нахут,_сирене_и_авокадо',
      desc: 'Нахут, фета сирене и авокадо с лимонов дресинг.',
    },
    {
      title: 'Пълнени гъби със спанак, галета и сирене',
      keys: ['гъб', 'спанак', 'сирен', 'кашкав'],
      url: 'https://recepti.gotvach.bg/r-287965-Пълнени_гъби_със_спанак,_галета_и_сирене',
      desc: 'Гъбени шапки, пълнени с ароматна смес от спанак и сирене.',
    },
    {
      title: 'Шопска салата',
      keys: ['домат', 'краставиц', 'чушк', 'сирен', 'фета', 'лук'],
      url: 'https://recepti.gotvach.bg/r-280000-Шопска_салата',
      desc: 'Класическа шопска салата с домати, краставици, чушки и бяло сирене.',
    },
    {
      title: 'Салата с моркови и чесън',
      keys: ['морков', 'чесън', 'лимон'],
      url: 'https://recepti.gotvach.bg/r-283000-Салата_от_моркови_с_чесън',
      desc: 'Настъргани моркови с чесън и лимонов сок — лека и здравословна.',
    },
  ],

  // Българска кухня
  bulgarian: [
    {
      title: 'Меки като облак златисти палачинки',
      keys: ['яйц', 'мляко', 'млечн', 'брашн'],
      url: 'https://recepti.gotvach.bg/r-287947-Меки_като_облак_златисти_палачинки',
      desc: 'Пухкави палачинки с мляко и яйца — класическа закуска за цялото семейство.',
    },
    {
      title: 'Панирани картофени кюфтета с пресен лук',
      keys: ['картоф', 'лук', 'яйц', 'брашн'],
      url: 'https://recepti.gotvach.bg/r-289466-Панирани_картофени_кюфтета_с_пресен_лук',
      desc: 'Картофени кюфтета с пресен лук, панирани и запържени до хрупкавост.',
    },
    {
      title: 'Постни сарми от лапад',
      keys: ['ориз', 'лук', 'морков', 'домат'],
      url: 'https://recepti.gotvach.bg/r-289416-Постни_сарми_от_лапад',
      desc: 'Традиционни постни сарми, завити в листа от лапад с пълнеж от ориз и лук.',
    },
    {
      title: 'Мусака с картофи и кайма',
      keys: ['кайма', 'картоф', 'яйц', 'мляко', 'лук'],
      url: 'https://recepti.gotvach.bg/r-281000-Мусака_с_картофи_и_кайма',
      desc: 'Класическа мусака с кайма, картофи и коричка от яйца и мляко.',
    },
    {
      title: 'Баница със сирене',
      keys: ['сирен', 'фета', 'яйц', 'масл'],
      url: 'https://recepti.gotvach.bg/r-280500-Баница_със_сирене',
      desc: 'Домашна баница с бяло сирене и яйца — хрупкава и вкусна закуска.',
    },
    {
      title: 'Гювеч с телешко и зеленчуци',
      keys: ['говежд', 'телешк', 'картоф', 'морков', 'чушк', 'домат', 'лук'],
      url: 'https://recepti.gotvach.bg/r-282000-Гювеч_с_телешко_и_зеленчуци',
      desc: 'Телешко месо задушено с картофи, моркови и чушки в гювеч.',
    },
  ],

  // Десерти
  dessert: [
    {
      title: 'Постна портокалова торта без захар и печене',
      keys: ['портокал', 'бисквит'],
      url: 'https://recepti.gotvach.bg/r-289315-Постна_портокалова_торта_без_захар_и_печене',
      desc: 'Лесна торта с бисквити и портокалов крем — без печене и без захар.',
    },
    {
      title: 'Бяла бисквитена торта с бананов крем',
      keys: ['банан', 'мляко', 'млечн', 'бисквит'],
      url: 'https://recepti.gotvach.bg/r-289509-Бяла_бисквитена_торта_с_бананов_крем',
      desc: 'Бисквитена торта с копринен бананов крем — без фурна.',
    },
    {
      title: 'Плодова салата с мед',
      keys: ['ябълк', 'банан', 'портокал', 'мед'],
      url: 'https://recepti.gotvach.bg/r-283000-Плодова_салата_с_мед',
      desc: 'Свежа плодова салата с мед и лимон — лек и здравословен десерт.',
    },
  ],

  // Вегетарианска
  veg: [
    {
      title: 'Хрупкави топчета от броколи',
      keys: ['брокол', 'яйц', 'сирен', 'кашкав'],
      url: 'https://recepti.gotvach.bg/r-287422-Хрупкави_топчета_от_броколи',
      desc: 'Броколи, смесено с яйца и сирене, оформено на топчета и запечено.',
    },
    {
      title: 'Домашна пица с левурда и моцарела',
      keys: ['сирен', 'моцарел', 'кашкав', 'домат', 'брашн'],
      url: 'https://recepti.gotvach.bg/r-288552-Домашна_пица_с_левурда_и_моцарела',
      desc: 'Домашна пица с тесто, левурда и разтопена моцарела.',
    },
    {
      title: 'Пъстра яхния от зеленчуци',
      keys: ['тиквич', 'чушк', 'домат', 'лук', 'морков', 'картоф'],
      url: 'https://recepti.gotvach.bg/r-286000-Пъстра_яхния_от_зеленчуци',
      desc: 'Сезонни зеленчуци, задушени с домати и подправки до нежна яхния.',
    },
    {
      title: 'Пържени тиквички с кисело мляко',
      keys: ['тиквич', 'кисело', 'млечн', 'чесън', 'яйц'],
      url: 'https://recepti.gotvach.bg/r-284000-Пържени_тиквички_с_кисело_мляко',
      desc: 'Хрупкави тиквички, поднесени с чеснов сос от кисело мляко.',
    },
  ],
};

// ─── Matching logic ───────────────────────────────────────────────────────────

// Extract meaningful tokens from a product name (strip weights, numbers, abbreviations)
function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*(кг|г|л|мл|бр\.?|х|x)/g, '')
    .replace(/[^а-яёa-z\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Score a recipe by how many of its keys appear in the product tokens
function scoreRecipe(recipe, products) {
  const allTokens = products.flatMap((p) => tokenize(p.name));
  let score = 0;
  for (const key of recipe.keys) {
    if (allTokens.some((t) => t.startsWith(key) || key.startsWith(t))) {
      score++;
    }
  }
  return score;
}

// Which product names actually match a recipe (for display)
function matchedProducts(recipe, products, max = 3) {
  return products
    .filter((p) => {
      const tokens = tokenize(p.name);
      return recipe.keys.some((key) => tokens.some((t) => t.startsWith(key) || key.startsWith(t)));
    })
    .slice(0, max);
}

// Slot → candidate pools (ordered by preference)
const SLOT_POOLS = {
  breakfast: ['bulgarian', 'salad', 'dessert'],
  lunch:     ['meat', 'fish', 'soup', 'bulgarian', 'veg'],
  dinner:    ['meat', 'fish', 'veg', 'bulgarian', 'soup'],
  snack:     ['salad', 'dessert', 'veg'],
};

function pickRecipe(slotKey, allProducts, usedTitles) {
  const poolKeys = SLOT_POOLS[slotKey];
  const candidates = poolKeys.flatMap((k) => RECIPES[k] || []);
  const available = candidates.filter((r) => !usedTitles.has(r.title));
  const pool = available.length ? available : candidates;

  const scored = pool
    .map((r) => ({ recipe: r, score: scoreRecipe(r, allProducts) }))
    .sort((a, b) => b.score - a.score);

  // If best score > 0 use it; otherwise rotate deterministically for variety
  if (scored[0].score > 0) return scored[0].recipe;
  const seed = (allProducts[0]?.id?.charCodeAt?.(0) || 0) % pool.length;
  return pool[seed] || pool[0];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  meat: '🥩', dairy: '🥛', vegetables: '🥦', fruit: '🍎',
  grains: '🌾', snacks: '🍪', drinks: '🥤', fish: '🐟',
  eggs: '🥚', legumes: '🫘', bakery: '🍞', frozen: '🧊',
  protein: '💪', organic: '🌿', oils: '🫙', canned: '🥫',
};

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

function cleanName(raw) {
  return raw
    .replace(/\s*(≈|~)?\d+(\.\d+)?(кг|г|л|мл)\b/gi, '')
    .replace(/\s*\d+x\d+[^\s]*/gi, '')
    .replace(/\bXXL\b|\bXL\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list } = route.params || {};
  const allProducts = list || [];

  const usedTitles = new Set();

  const slots = MEAL_SLOTS.map((slot) => {
    const recipe = pickRecipe(slot.key, allProducts, usedTitles);
    usedTitles.add(recipe.title);
    const featured = matchedProducts(recipe, allProducts);
    return { slot, recipe, featured };
  });

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Рецепти от gotvach.bg по вашите продукти</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Дневен план</Text>

        {slots.map(({ slot, recipe, featured }) => (
          <View key={slot.key} style={[styles.card, { borderLeftColor: slot.color }]}>

            {/* Slot badge */}
            <View style={[styles.badge, { backgroundColor: slot.color }]}>
              <Text style={styles.badgeIcon}>{slot.icon}</Text>
              <Text style={styles.badgeLabel}>{slot.label}</Text>
            </View>

            {/* Recipe name */}
            <Text style={styles.recipeTitle}>{recipe.title}</Text>

            {/* Matched products from the list */}
            {featured.length > 0 && (
              <View style={styles.productsBox}>
                <Text style={styles.productsLabel}>Използва от вашия списък:</Text>
                <View style={styles.pills}>
                  {featured.map((p) => (
                    <View key={p.id} style={[styles.pill, { borderColor: slot.color }]}>
                      <Text style={styles.pillIcon}>{getCategoryIcon(p.category)}</Text>
                      <Text style={[styles.pillText, { color: slot.color }]}>{cleanName(p.name)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Short description */}
            <View style={styles.descBox}>
              <Text style={styles.descText}>{recipe.desc}</Text>
            </View>

            {/* Link */}
            <TouchableOpacity
              style={[styles.linkBtn, { backgroundColor: slot.color }]}
              onPress={() => Linking.openURL(recipe.url).catch(() => {})}
            >
              <Text style={styles.linkBtnText}>📖 Виж пълната рецепта</Text>
            </TouchableOpacity>

          </View>
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub:   { fontSize: 13, color: '#999' },

  scroll: { padding: 16 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    gap: 5, marginBottom: 12,
  },
  badgeIcon:  { fontSize: 13 },
  badgeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  recipeTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 12, lineHeight: 24 },

  productsBox:   { marginBottom: 12 },
  productsLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', marginBottom: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: '700' },

  descBox: { backgroundColor: '#FFFBEA', borderRadius: 10, padding: 12, marginBottom: 12 },
  descText: { fontSize: 13, color: '#7d6608', lineHeight: 20 },

  linkBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

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
