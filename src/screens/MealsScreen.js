import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Linking,
} from 'react-native';

// ─── Real gotvach.bg recipes, fetched from RSS and hardcoded for reliability ──
// URL format: https://recepti.gotvach.bg/r-{id}-{slug}

const RECIPES = {
  // Ястия с месо (feed 7)
  meat: [
    { title: 'Бързо пиле с аспержи на тиган',                   url: 'https://recepti.gotvach.bg/r-289518-Бързо_пиле_с_аспержи_на_тиган',                  desc: 'Пилешкото филе се нарязва на малки хапки и се запържва в тиган с масло и подправки.' },
    { title: 'Свинско контрафиле на тиган с хрупкави аспержи',  url: 'https://recepti.gotvach.bg/r-289553-Свинско_контрафиле_на_тиган_с_хрупкави_аспержи', desc: 'Свинското контрафиле се изпича на тиган до хрупкава коричка и се поднася с аспержи.' },
    { title: 'Крехко телешко с лук и домати',                   url: 'https://recepti.gotvach.bg/r-289493-Крехко_телешко_с_лук_и_домати_(Swiss_Steak)',     desc: 'Телешките пържоли се задушават с лук и домати до пълно омекване.' },
    { title: 'Ароматно свинско печено с картофи и зеленчуци',   url: 'https://recepti.gotvach.bg/r-289479-Ароматно_свинско_печено_с_картофи_и_зеленчуци',  desc: 'Свинско месо, печено на фурна с картофи, моркови и подправки на 190°C.' },
    { title: 'Агнешки джоланчета с картофи',                    url: 'https://recepti.gotvach.bg/r-288118-Агнешки_джоланчета_с_картофи',                   desc: 'Агнешки джолани, бавно изпечени с картофи и ароматни подправки.' },
  ],
  // Риба и Морски Дарове (feed 209)
  fish: [
    { title: 'Лека рибна запеканка за вечеря',          url: 'https://recepti.gotvach.bg/r-289340-Лека_рибна_запеканка_за_вечеря',           desc: 'Рибно филе с хляб и зеленчуци, запечено на фурна за лека вечеря.' },
    { title: 'Сьомга със сос от синьо сирене и гъби',  url: 'https://recepti.gotvach.bg/r-288255-Сьомга_със_сос_от_синьо_сирене_и_гъби',   desc: 'Сьомга, изпечена на тиган и поднесена с кремообразен сос от сирене и гъби.' },
    { title: 'Скариди в чесново масло',                 url: 'https://recepti.gotvach.bg/r-288260-Скариди_в_чесново_масло',                  desc: 'Скаридите се запържват в масло с чесън и магданоз — готово за 10 минути.' },
    { title: 'Кеджъри с пушена сьомга и ориз',         url: 'https://recepti.gotvach.bg/r-288256-Кеджъри_с_пушена_сьомга_и_ориз',          desc: 'Класическо ястие с пушена сьомга, ориз и яйца — сити и ароматно.' },
    { title: 'Печена риба със зеленчуци',               url: 'https://recepti.gotvach.bg/r-288027-Печена_риба_със_зеленчуци_-_тип_пеперуда', desc: 'Цяла риба, разгъната като пеперуда и изпечена с пресни зеленчуци.' },
  ],
  // Чорби и супи (feed 8)
  soup: [
    { title: 'Перфектната крем супа от леща',              url: 'https://recepti.gotvach.bg/r-288374-Перфектната_крем_супа_от_леща',               desc: 'Кадифена крем супа от червена леща с лук, морков и подправки.' },
    { title: 'Крем супа от спанак, батат и пащърнак',     url: 'https://recepti.gotvach.bg/r-287955-Крем_супа_от_спанак,_батат_и_пащърнак',      desc: 'Богата крем супа от спанак и сладки картофи — здравословна и засища.' },
    { title: 'Нежна крем супа с праз и гъби',             url: 'https://recepti.gotvach.bg/r-287367-Нежна_крем_супа_с_праз_и_гъби',              desc: 'Праз и гъби, задушени с масло и пасирани до копринена текстура.' },
    { title: 'Гъбена супа от челядинки и карфиол',        url: 'https://recepti.gotvach.bg/r-287460-Гъбена_супа_от_челядинки_и_карфиол',         desc: 'Ароматна гъбена супа с карфиол — лека и изпълнена с вкус.' },
  ],
  // Салати и предястия (feed 10)
  salad: [
    { title: 'Класическа яйчена салата с грах',         url: 'https://recepti.gotvach.bg/r-289505-Класическа_яйчена_салата_с_грах',           desc: 'Твърдо сварени яйца, грах и майонеза — бърза и вкусна салата.' },
    { title: 'Салата с нахут, сирене и авокадо',        url: 'https://recepti.gotvach.bg/r-287964-Салата_с_нахут,_сирене_и_авокадо',          desc: 'Нахут, фета сирене и авокадо с лимонов дресинг.' },
    { title: 'Пълнени гъби със спанак, галета и сирене',url: 'https://recepti.gotvach.bg/r-287965-Пълнени_гъби_със_спанак,_галета_и_сирене',  desc: 'Гъбени шапки, пълнени с ароматна смес от спанак и сирене.' },
    { title: 'Лека гръцка великденска салата',          url: 'https://recepti.gotvach.bg/r-289471-Лека_гръцка_великденска_салата',            desc: 'Китайско зеле, чери домати и фета с лек дресинг.' },
  ],
  // Българска кухня (feed 14)
  bulgarian: [
    { title: 'Меки като облак златисти палачинки',                url: 'https://recepti.gotvach.bg/r-287947-Меки_като_облак_златисти_палачинки',                 desc: 'Пухкави палачинки с мляко и яйца — класическа закуска за цялото семейство.' },
    { title: 'Пролетна супа от киселец с яйца',                   url: 'https://recepti.gotvach.bg/r-288162-Пролетна_супа_от_киселец_с_яйца',                    desc: 'Лека пролетна супа от киселец с яйца и застройка.' },
    { title: 'Панирани картофени кюфтета с пресен лук',           url: 'https://recepti.gotvach.bg/r-289466-Панирани_картофени_кюфтета_с_пресен_лук',            desc: 'Картофени кюфтета с пресен лук, панирани и запържени до хрупкавост.' },
    { title: 'Постни сарми от лапад',                             url: 'https://recepti.gotvach.bg/r-289416-Постни_сарми_от_лапад',                              desc: 'Традиционни постни сарми, завити в листа от лапад с пълнеж от ориз и лук.' },
  ],
  // Десерти и сладкиши (feed 6)
  dessert: [
    { title: 'Постна портокалова торта без захар и печене', url: 'https://recepti.gotvach.bg/r-289315-Постна_портокалова_торта_без_захар_и_печене', desc: 'Лесна торта с бисквити и портокалов крем — без печене и без захар.' },
    { title: 'Бяла бисквитена торта с бананов крем',        url: 'https://recepti.gotvach.bg/r-289509-Бяла_бисквитена_торта_с_бананов_крем',        desc: 'Бисквитена торта с копринен бананов крем — без фурна.' },
  ],
  // Вегетарианска кухня (feed 18)
  veg: [
    { title: 'Хрупкави топчета от броколи',    url: 'https://recepti.gotvach.bg/r-287422-Хрупкави_топчета_от_броколи',    desc: 'Броколи, смесено с яйца и сирене, оформено на топчета и запечено.' },
    { title: 'Домашна пица с левурда и моцарела', url: 'https://recepti.gotvach.bg/r-288552-Домашна_пица_с_левурда_и_моцарела', desc: 'Домашна пица с тесто, левурда и разтопена моцарела.' },
  ],
};

// ─── Category → recipe pool mapping ─────────────────────────────────────────

const SLOT_POOLS = {
  breakfast: ['bulgarian', 'salad', 'dessert'],
  lunch:     { meat: 'meat', fish: 'fish', default: 'soup' },
  dinner:    { meat: 'meat', fish: 'fish', default: 'bulgarian' },
  snack:     ['salad', 'dessert'],
};

function pickRecipe(slotKey, products) {
  const cats = products.map((p) => p.category?.toLowerCase());

  let poolKey;
  if (slotKey === 'lunch' || slotKey === 'dinner') {
    if (cats.includes('meat'))  poolKey = 'meat';
    else if (cats.includes('fish')) poolKey = 'fish';
    else if (cats.includes('vegetables') || cats.includes('legumes')) poolKey = slotKey === 'lunch' ? 'soup' : 'veg';
    else poolKey = slotKey === 'lunch' ? 'soup' : 'bulgarian';
  } else {
    // breakfast / snack
    const order = SLOT_POOLS[slotKey];
    poolKey = order[0]; // default
    for (const cat of cats) {
      if (cat === 'dairy' || cat === 'eggs' || cat === 'bakery') { poolKey = 'bulgarian'; break; }
      if (cat === 'fruit') { poolKey = 'dessert'; break; }
    }
  }

  const pool = RECIPES[poolKey] || RECIPES.bulgarian;

  // Try to find a recipe whose title matches a product keyword
  const keywords = products.map((p) =>
    p.name.replace(/\s*(≈|~)?\d+(\.\d+)?(кг|г|л|мл)\b/gi, '').trim().split(' ').slice(0, 2).join(' ').toLowerCase()
  );
  const match = pool.find((r) =>
    keywords.some((kw) => r.title.toLowerCase().includes(kw))
  );

  // Deterministic variety: rotate by first product id hash
  const seed = (products[0]?.id?.charCodeAt?.(0) || 0) % pool.length;
  return match || pool[seed] || pool[0];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  meat: '🥩', dairy: '🥛', vegetables: '🥦', fruit: '🍎',
  grains: '🌾', snacks: '🍪', drinks: '🥤', fish: '🐟',
  eggs: '🥚', legumes: '🫘', bakery: '🍞', frozen: '🧊',
  protein: '💪', organic: '🌿', oils: '🫙', canned: '🥫',
};

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12', cats: ['eggs', 'dairy', 'bakery', 'grains', 'fruit', 'protein'] },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF', cats: ['meat', 'fish', 'vegetables', 'legumes', 'grains'] },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71', cats: ['meat', 'fish', 'grains', 'dairy', 'vegetables', 'eggs'] },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c', cats: ['fruit', 'snacks', 'dairy', 'protein'] },
];

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

function cleanName(raw) {
  return raw
    .replace(/\s*(≈|~)?\d+(\.\d+)?(кг|г|л|мл)\b/gi, '')
    .replace(/\s*\d+x\d+[^\s]*/gi, '')
    .replace(/\bXXL\b|\bXL\b/gi, '')
    .replace(/^(Месо за готвене|Мариновани|Панирани|Деликатесен|Висококопротеин\w+|Пресни|Био)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

function pickProducts(byCategory, cats, max = 3) {
  const picked = [];
  for (const cat of cats) {
    for (const p of byCategory[cat] || []) {
      picked.push(p);
      if (picked.length >= max) return picked;
    }
  }
  return picked;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list, goal } = route.params || {};

  const byCategory = {};
  (list || []).forEach((item) => {
    const cat = item.category?.toLowerCase() || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  const slots = MEAL_SLOTS.map((slot) => {
    const cats =
      goal === 'high_protein' && slot.key === 'snack'
        ? ['protein', 'dairy', 'eggs', ...slot.cats]
        : slot.cats;
    const products = pickProducts(byCategory, cats);
    const recipe   = pickRecipe(slot.key, products);
    return { slot, products, recipe };
  });

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Рецепти от gotvach.bg по вашите продукти</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Дневен план</Text>

        {slots.map(({ slot, products, recipe }) => (
          <View key={slot.key} style={[styles.card, { borderLeftColor: slot.color }]}>

            {/* Slot badge */}
            <View style={[styles.badge, { backgroundColor: slot.color }]}>
              <Text style={styles.badgeIcon}>{slot.icon}</Text>
              <Text style={styles.badgeLabel}>{slot.label}</Text>
            </View>

            {/* Recipe name */}
            <Text style={styles.recipeTitle}>{recipe.title}</Text>

            {/* Matched products */}
            {products.length > 0 && (
              <View style={styles.productsBox}>
                <Text style={styles.productsLabel}>Продукти от вашия списък:</Text>
                <View style={styles.pills}>
                  {products.map((p) => (
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
