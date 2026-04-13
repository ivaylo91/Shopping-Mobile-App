import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { getCategoryIcon } from '../utils/ui';

// ─── Recipes with ingredient keys for matching ────────────────────────────────
// keys[]     = Bulgarian word stems of main ingredients (4-6 chars, lowercase)
// calories   = estimated kcal per serving
// Matching: product name token starts with key, or key starts with token

const RECIPES = {
  // Месо
  meat: [
    {
      title: 'Бързо пиле с аспержи на тиган',
      keys: ['пиле', 'пилешк', 'аспержи', 'масл'],
      calories: 320,
      url: 'https://recepti.gotvach.bg/r-289518-Бързо_пиле_с_аспержи_на_тиган',
      desc: 'Пилешкото филе се нарязва на малки хапки и се запържва в тиган с масло и подправки.',
    },
    {
      title: 'Свинско контрафиле на тиган с хрупкави аспержи',
      keys: ['свинск', 'контраф', 'аспержи'],
      calories: 420,
      url: 'https://recepti.gotvach.bg/r-289553-Свинско_контрафиле_на_тиган_с_хрупкави_аспержи',
      desc: 'Свинското контрафиле се изпича на тиган до хрупкава коричка и се поднася с аспержи.',
    },
    {
      title: 'Крехко телешко с лук и домати',
      keys: ['говежд', 'телешк', 'лук', 'домат'],
      calories: 380,
      url: 'https://recepti.gotvach.bg/r-289493-Крехко_телешко_с_лук_и_домати_(Swiss_Steak)',
      desc: 'Телешките пържоли се задушават с лук и домати до пълно омекване.',
    },
    {
      title: 'Ароматно свинско печено с картофи и зеленчуци',
      keys: ['свинск', 'картоф', 'морков', 'лук'],
      calories: 490,
      url: 'https://recepti.gotvach.bg/r-289479-Ароматно_свинско_печено_с_картофи_и_зеленчуци',
      desc: 'Свинско месо, печено на фурна с картофи, моркови и подправки на 190°C.',
    },
    {
      title: 'Агнешки джоланчета с картофи',
      keys: ['агнешк', 'джолан', 'картоф', 'лук'],
      calories: 510,
      url: 'https://recepti.gotvach.bg/r-288118-Агнешки_джоланчета_с_картофи',
      desc: 'Агнешки джолани, бавно изпечени с картофи и ароматни подправки.',
    },
    {
      title: 'Кайма с ориз и зеленчуци',
      keys: ['кайма', 'ориз', 'домат', 'чушк', 'лук'],
      calories: 410,
      url: 'https://recepti.gotvach.bg/r-288000-Кайма_с_ориз_и_зеленчуци',
      desc: 'Телешка или смесена кайма задушена с ориз, домати и чушки.',
    },
    {
      title: 'Пиле с картофи на фурна',
      keys: ['пиле', 'пилешк', 'картоф', 'лук'],
      calories: 450,
      url: 'https://recepti.gotvach.bg/r-287000-Пиле_с_картофи_на_фурна',
      desc: 'Класическо пиле с картофи, изпечено на фурна с масло и подправки.',
    },
  ],

  // Риба
  fish: [
    {
      title: 'Лека рибна запеканка за вечеря',
      keys: ['риба', 'рибн', 'рибно', 'лук', 'домат'],
      calories: 290,
      url: 'https://recepti.gotvach.bg/r-289340-Лека_рибна_запеканка_за_вечеря',
      desc: 'Рибно филе с хляб и зеленчуци, запечено на фурна за лека вечеря.',
    },
    {
      title: 'Сьомга със сос от синьо сирене и гъби',
      keys: ['сьомга', 'сирен', 'гъб', 'печурк', 'масл'],
      calories: 370,
      url: 'https://recepti.gotvach.bg/r-288255-Сьомга_със_сос_от_синьо_сирене_и_гъби',
      desc: 'Сьомга, изпечена на тиган и поднесена с кремообразен сос от сирене и гъби.',
    },
    {
      title: 'Скариди в чесново масло',
      keys: ['скарид', 'масл', 'чесън'],
      calories: 240,
      url: 'https://recepti.gotvach.bg/r-288260-Скариди_в_чесново_масло',
      desc: 'Скаридите се запържват в масло с чесън и магданоз — готово за 10 минути.',
    },
    {
      title: 'Кеджъри с пушена сьомга и ориз',
      keys: ['сьомга', 'ориз', 'яйц'],
      calories: 420,
      url: 'https://recepti.gotvach.bg/r-288256-Кеджъри_с_пушена_сьомга_и_ориз',
      desc: 'Класическо ястие с пушена сьомга, ориз и яйца — сити и ароматно.',
    },
    {
      title: 'Печена риба със зеленчуци',
      keys: ['риба', 'рибн', 'рибно', 'картоф', 'лук', 'домат'],
      calories: 310,
      url: 'https://recepti.gotvach.bg/r-288027-Печена_риба_със_зеленчуци_-_тип_пеперуда',
      desc: 'Цяла риба, разгъната като пеперуда и изпечена с пресни зеленчуци.',
    },
  ],

  // Супи
  soup: [
    {
      title: 'Перфектната крем супа от леща',
      keys: ['леща', 'лещен', 'червена', 'морков', 'лук'],
      calories: 220,
      url: 'https://recepti.gotvach.bg/r-288374-Перфектната_крем_супа_от_леща',
      desc: 'Кадифена крем супа от червена леща с лук, морков и подправки.',
    },
    {
      title: 'Крем супа от спанак, батат и пащърнак',
      keys: ['спанак', 'батат', 'морков'],
      calories: 190,
      url: 'https://recepti.gotvach.bg/r-287955-Крем_супа_от_спанак,_батат_и_пащърнак',
      desc: 'Богата крем супа от спанак и сладки картофи — здравословна и засища.',
    },
    {
      title: 'Нежна крем супа с праз и гъби',
      keys: ['гъб', 'печурк', 'праз', 'лук', 'картоф'],
      calories: 210,
      url: 'https://recepti.gotvach.bg/r-287367-Нежна_крем_супа_с_праз_и_гъби',
      desc: 'Праз и гъби, задушени с масло и пасирани до копринена текстура.',
    },
    {
      title: 'Пилешка супа с фиде',
      keys: ['пиле', 'пилешк', 'морков', 'лук', 'целин'],
      calories: 260,
      url: 'https://recepti.gotvach.bg/r-286000-Пилешка_супа_с_фиде',
      desc: 'Домашна пилешка супа с моркови, лук и фиде — топла и засищаща.',
    },
    {
      title: 'Боб чорба по старобългарски',
      keys: ['боб', 'лук', 'морков', 'чушк', 'домат', 'едър'],
      calories: 280,
      url: 'https://recepti.gotvach.bg/r-285000-Боб_чорба_по_старобългарски',
      desc: 'Традиционна боб чорба с морков, лук и чушки — класика на българската кухня.',
    },
    {
      title: 'Картофена супа с кашкавал',
      keys: ['картоф', 'сирен', 'кашкав', 'лук'],
      calories: 300,
      url: 'https://recepti.gotvach.bg/r-287000-Картофена_супа_с_кашкавал',
      desc: 'Гъста картофена супа с разтопен кашкавал и лук — сгряваща и вкусна.',
    },
  ],

  // Салати
  salad: [
    {
      title: 'Класическа яйчена салата с грах',
      keys: ['яйц', 'грах', 'майонез'],
      calories: 180,
      url: 'https://recepti.gotvach.bg/r-289505-Класическа_яйчена_салата_с_грах',
      desc: 'Твърдо сварени яйца, грах и майонеза — бърза и вкусна салата.',
    },
    {
      title: 'Салата с нахут, сирене и авокадо',
      keys: ['нахут', 'сирен', 'фета', 'домат', 'краставиц', 'маслин'],
      calories: 310,
      url: 'https://recepti.gotvach.bg/r-287964-Салата_с_нахут,_сирене_и_авокадо',
      desc: 'Нахут, фета сирене и авокадо с лимонов дресинг.',
    },
    {
      title: 'Пълнени гъби със спанак, галета и сирене',
      keys: ['гъб', 'печурк', 'спанак', 'сирен', 'кашкав'],
      calories: 270,
      url: 'https://recepti.gotvach.bg/r-287965-Пълнени_гъби_със_спанак,_галета_и_сирене',
      desc: 'Гъбени шапки, пълнени с ароматна смес от спанак и сирене.',
    },
    {
      title: 'Шопска салата',
      keys: ['домат', 'краставиц', 'чушк', 'сирен', 'фета', 'лук', 'маслин'],
      calories: 150,
      url: 'https://recepti.gotvach.bg/r-280000-Шопска_салата',
      desc: 'Класическа шопска салата с домати, краставици, чушки и бяло сирене.',
    },
    {
      title: 'Салата с моркови и чесън',
      keys: ['морков', 'чесън', 'лимон'],
      calories: 90,
      url: 'https://recepti.gotvach.bg/r-283000-Салата_от_моркови_с_чесън',
      desc: 'Настъргани моркови с чесън и лимонов сок — лека и здравословна.',
    },
  ],

  // Българска кухня
  bulgarian: [
    {
      title: 'Меки като облак златисти палачинки',
      keys: ['яйц', 'мляко', 'млечн', 'кисело', 'краве', 'брашн', 'хляб', 'земел'],
      calories: 340,
      url: 'https://recepti.gotvach.bg/r-287947-Меки_като_облак_златисти_палачинки',
      desc: 'Пухкави палачинки с мляко и яйца — класическа закуска за цялото семейство.',
    },
    {
      title: 'Панирани картофени кюфтета с пресен лук',
      keys: ['картоф', 'лук', 'яйц', 'брашн'],
      calories: 360,
      url: 'https://recepti.gotvach.bg/r-289466-Панирани_картофени_кюфтета_с_пресен_лук',
      desc: 'Картофени кюфтета с пресен лук, панирани и запържени до хрупкавост.',
    },
    {
      title: 'Постни сарми от лапад',
      keys: ['ориз', 'лук', 'морков', 'домат'],
      calories: 290,
      url: 'https://recepti.gotvach.bg/r-289416-Постни_сарми_от_лапад',
      desc: 'Традиционни постни сарми, завити в листа от лапад с пълнеж от ориз и лук.',
    },
    {
      title: 'Мусака с картофи и кайма',
      keys: ['кайма', 'картоф', 'яйц', 'мляко', 'кисело', 'лук'],
      calories: 480,
      url: 'https://recepti.gotvach.bg/r-281000-Мусака_с_картофи_и_кайма',
      desc: 'Класическа мусака с кайма, картофи и коричка от яйца и мляко.',
    },
    {
      title: 'Баница със сирене',
      keys: ['сирен', 'фета', 'яйц', 'масл', 'хляб', 'тутманик'],
      calories: 410,
      url: 'https://recepti.gotvach.bg/r-280500-Баница_със_сирене',
      desc: 'Домашна баница с бяло сирене и яйца — хрупкава и вкусна закуска.',
    },
    {
      title: 'Гювеч с телешко и зеленчуци',
      keys: ['говежд', 'телешк', 'картоф', 'морков', 'чушк', 'домат', 'лук'],
      calories: 430,
      url: 'https://recepti.gotvach.bg/r-282000-Гювеч_с_телешко_и_зеленчуци',
      desc: 'Телешко месо задушено с картофи, моркови и чушки в гювеч.',
    },
  ],

  // Десерти
  dessert: [
    {
      title: 'Постна портокалова торта без захар и печене',
      keys: ['портокал', 'бисквит'],
      calories: 260,
      url: 'https://recepti.gotvach.bg/r-289315-Постна_портокалова_торта_без_захар_и_печене',
      desc: 'Лесна торта с бисквити и портокалов крем — без печене и без захар.',
    },
    {
      title: 'Бяла бисквитена торта с бананов крем',
      keys: ['банан', 'мляко', 'млечн', 'бисквит'],
      calories: 320,
      url: 'https://recepti.gotvach.bg/r-289509-Бяла_бисквитена_торта_с_бананов_крем',
      desc: 'Бисквитена торта с копринен бананов крем — без фурна.',
    },
    {
      title: 'Плодова салата с мед',
      keys: ['ябълк', 'банан', 'портокал', 'мед'],
      calories: 120,
      url: 'https://recepti.gotvach.bg/r-283000-Плодова_салата_с_мед',
      desc: 'Свежа плодова салата с мед и лимон — лек и здравословен десерт.',
    },
  ],

  // Вегетарианска
  veg: [
    {
      title: 'Хрупкави топчета от броколи',
      keys: ['брокол', 'яйц', 'сирен', 'кашкав'],
      calories: 230,
      url: 'https://recepti.gotvach.bg/r-287422-Хрупкави_топчета_от_броколи',
      desc: 'Броколи, смесено с яйца и сирене, оформено на топчета и запечено.',
    },
    {
      title: 'Домашна пица с левурда и моцарела',
      keys: ['сирен', 'моцарел', 'кашкав', 'домат', 'брашн'],
      calories: 520,
      url: 'https://recepti.gotvach.bg/r-288552-Домашна_пица_с_левурда_и_моцарела',
      desc: 'Домашна пица с тесто, левурда и разтопена моцарела.',
    },
    {
      title: 'Пъстра яхния от зеленчуци',
      keys: ['тиквич', 'чушк', 'домат', 'лук', 'морков', 'картоф'],
      calories: 180,
      url: 'https://recepti.gotvach.bg/r-286000-Пъстра_яхния_от_зеленчуци',
      desc: 'Сезонни зеленчуци, задушени с домати и подправки до нежна яхния.',
    },
    {
      title: 'Пържени тиквички с кисело мляко',
      keys: ['тиквич', 'кисело', 'млечн', 'чесън', 'яйц'],
      calories: 200,
      url: 'https://recepti.gotvach.bg/r-284000-Пържени_тиквички_с_кисело_мляко',
      desc: 'Хрупкави тиквички, поднесени с чеснов сос от кисело мляко.',
    },
  ],
};

// ─── Matching logic ───────────────────────────────────────────────────────────

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*(кг|г|л|мл|бр\.?|х|x)/g, '')
    .replace(/[^а-яёa-z\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreRecipe(recipe, products) {
  const allTokens = products.flatMap((p) => tokenize(p.name));
  let score = 0;
  for (const key of recipe.keys) {
    if (allTokens.some((t) => t.startsWith(key) || key.startsWith(t))) score++;
  }
  return score;
}

function matchedProducts(recipe, products, max = 3) {
  return products
    .filter((p) => {
      const tokens = tokenize(p.name);
      return recipe.keys.some((key) => tokens.some((t) => t.startsWith(key) || key.startsWith(t)));
    })
    .slice(0, max);
}

const SLOT_POOLS = {
  breakfast: ['bulgarian', 'salad', 'dessert'],
  lunch:     ['meat', 'fish', 'soup', 'veg', 'bulgarian'],
  dinner:    ['meat', 'fish', 'veg', 'bulgarian', 'soup'],
  snack:     ['salad', 'dessert', 'veg'],
};

const SLOT_CATS = {
  breakfast: ['eggs', 'dairy', 'bakery', 'grains', 'fruit'],
  lunch:     ['meat', 'fish', 'vegetables', 'legumes', 'grains', 'canned'],
  dinner:    ['meat', 'fish', 'dairy', 'vegetables', 'eggs', 'grains', 'frozen'],
  snack:     ['fruit', 'snacks', 'dairy', 'bakery', 'frozen'],
};

function pickRecipe(slotKey, allProducts, usedTitles) {
  const poolKeys = SLOT_POOLS[slotKey];
  const candidates = poolKeys.flatMap((k) => RECIPES[k] || []);
  const available = candidates.filter((r) => !usedTitles.has(r.title));
  const pool = available.length ? available : candidates;

  const slotCats = SLOT_CATS[slotKey];
  const slotProducts = allProducts.filter((p) => slotCats.includes(p.category?.toLowerCase()));
  const scoringProducts = slotProducts.length > 0 ? slotProducts : allProducts;

  const scored = pool
    .map((r) => ({ recipe: r, score: scoreRecipe(r, scoringProducts) }))
    .sort((a, b) => b.score - a.score);

  if (scored[0].score > 0) return scored[0].recipe;

  const primary = (RECIPES[poolKeys[0]] || []).filter((r) => !usedTitles.has(r.title));
  return primary[0] || pool[0];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list } = route.params || {};
  const allProducts = list || [];

  // Sort products by calories descending for the top panel
  const productsSortedByCal = useMemo(
    () => [...allProducts].filter((p) => p.calories > 0).sort((a, b) => b.calories - a.calories),
    [allProducts]
  );

  const slots = useMemo(() => {
    const usedTitles = new Set();
    return MEAL_SLOTS.map((slot) => {
      const recipe = pickRecipe(slot.key, allProducts, usedTitles);
      usedTitles.add(recipe.title);
      const featured = matchedProducts(recipe, allProducts);
      return { slot, recipe, featured };
    });
  }, [allProducts]);

  // Total estimated calories across all meal slots
  const totalCal = useMemo(
    () => slots.reduce((sum, { recipe }) => sum + (recipe.calories || 0), 0),
    [slots]
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Рецепти от gotvach.bg по вашите продукти</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Products & Calories panel ── */}
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

        {/* ── Daily plan ── */}
        <View style={styles.section}>
          <View style={styles.planHeader}>
            <Text style={styles.sectionLabel}>Дневен план</Text>
            <View style={styles.totalCalBadge}>
              <Text style={styles.totalCalText}>~{totalCal} ккал общо</Text>
            </View>
          </View>

          {slots.map(({ slot, recipe, featured }) => (
            <View key={slot.key} style={[styles.card, { borderLeftColor: slot.color }]}>

              {/* Slot badge + calorie chip */}
              <View style={styles.cardTopRow}>
                <View style={[styles.badge, { backgroundColor: slot.color }]}>
                  <Text style={styles.badgeIcon}>{slot.icon}</Text>
                  <Text style={styles.badgeLabel}>{slot.label}</Text>
                </View>
                <View style={[styles.calChip, { borderColor: slot.color }]}>
                  <Text style={[styles.calChipText, { color: slot.color }]}>
                    {recipe.calories} ккал
                  </Text>
                </View>
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

              {/* Buttons row */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: slot.color, flex: 1 }]}
                  onPress={() => Linking.openURL(recipe.url).catch(() => {})}
                >
                  <Text style={styles.linkBtnText}>📖 Виж рецепта</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ytBtn, { flex: 1 }]}
                  onPress={() => Linking.openURL(youtubeUrl(recipe.title)).catch(() => {})}
                >
                  <Text style={styles.ytBtnText}>▶ YouTube</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>

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

  section: { marginBottom: 8 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },

  planHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  totalCalBadge: {
    backgroundColor: '#1A1A2E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  totalCalText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // ── Products calories strip ──
  calRow: { paddingBottom: 4, gap: 10 },
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

  // ── Recipe cards ──
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5,
  },
  badgeIcon:  { fontSize: 13 },
  badgeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  calChip: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  calChipText: { fontSize: 12, fontWeight: '800' },

  recipeTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 12, lineHeight: 23 },

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

  btnRow: { flexDirection: 'row', gap: 10 },
  linkBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ytBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#FF0000',
  },
  ytBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

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
