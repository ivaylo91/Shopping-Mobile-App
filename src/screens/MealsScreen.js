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

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Module-level cache (survives re-renders, cleared on app restart) ─────────
const recipeCache = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

/**
 * Smarter name cleaning:
 * - Strips weights/sizes ("≈1.1кг", "2x170г", "XXL")
 * - Strips leading generic Bulgarian phrases ("Месо за готвене", "Мариновани" …)
 * - Returns up to 3 meaningful words
 */
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

/**
 * Pick up to `max` products for a slot, respecting already-used product IDs.
 * Called sequentially so usedIds is always up-to-date before the next slot.
 */
function pickProducts(byCategory, cats, usedIds, max = 3) {
  const picked = [];
  for (const cat of cats) {
    for (const p of byCategory[cat] || []) {
      if (!usedIds.has(p.id)) {
        picked.push(p);
        if (picked.length >= max) return picked;
      }
    }
  }
  return picked;
}

/**
 * Fetch the first gotvach.bg recipe for `query`.
 * Results are cached in `recipeCache` so repeated opens cost 0 network calls.
 * Falls back to the search URL if parsing fails.
 */
async function fetchGotvachResult(query) {
  if (recipeCache.has(query)) return recipeCache.get(query);

  const searchUrl = `https://gotvach.bg/search?term=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    const html = await res.text();

    // Recipe URLs on gotvach.bg: /rec/DIGITS/slug
    const linkMatch = html.match(/href="(\/rec\/\d+\/[^"?#\s]+)"/);
    if (!linkMatch) {
      const fallback = { url: searchUrl, name: null, desc: null };
      recipeCache.set(query, fallback);
      return fallback;
    }

    const recipeUrl = `https://gotvach.bg${linkMatch[1]}`;

    const nameRe = new RegExp(
      `href="${linkMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>\\s*([^<]{3,120})\\s*<`,
    );
    const name = html.match(nameRe)?.[1]?.trim().replace(/&amp;/g, '&') || null;

    const start = Math.max(0, html.indexOf(linkMatch[1]) - 200);
    const snippet = html.slice(start, start + 600);
    const desc =
      snippet
        .match(/<p[^>]*>\s*([^<]{25,220})\s*<\/p>/)?.[1]
        ?.trim()
        .replace(/&amp;/g, '&')
        .replace(/&#\d+;/g, '') || null;

    const result = { url: recipeUrl, name, desc };
    recipeCache.set(query, result);
    return result;
  } catch {
    const fallback = { url: searchUrl, name: null, desc: null };
    recipeCache.set(query, fallback);
    return fallback;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list, goal } = route.params;
  // Each entry: { slot, products, status: 'loading'|'done', recipeName, recipeDesc, recipeUrl }
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    // ── Step 1: assign products sequentially (preserves usedIds correctness) ──
    const byCategory = {};
    list.forEach((item) => {
      const cat = item.category?.toLowerCase() || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    });

    const usedIds = new Set();
    const assignments = [];

    for (const slot of MEAL_SLOTS) {
      const cats =
        goal === 'high_protein' && slot.key === 'snack'
          ? ['protein', 'dairy', 'eggs', ...slot.cats]
          : slot.cats;

      const products = pickProducts(byCategory, cats, usedIds);
      if (!products.length) continue;

      products.forEach((p) => usedIds.add(p.id));
      assignments.push({ slot, products });
    }

    // ── Step 2: initialise all cards as "loading" immediately ──────────────
    setSlots(
      assignments.map(({ slot, products }) => ({
        slot, products, status: 'loading',
        recipeName: null, recipeDesc: null, recipeUrl: null,
      })),
    );

    // ── Step 3: fetch all slots in parallel, update each as it resolves ────
    Promise.all(
      assignments.map(async ({ products }, idx) => {
        const query = products.map(cleanName).join(' ');
        const { url, name, desc } = await fetchGotvachResult(query);
        setSlots((prev) =>
          prev.map((s, i) =>
            i === idx
              ? { ...s, status: 'done', recipeName: name, recipeDesc: desc, recipeUrl: url }
              : s,
          ),
        );
      }),
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
        <Text style={styles.headerSub}>Рецепти от gotvach.bg по вашите продукти</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Дневен план</Text>

        {slots.length === 0 && (
          <View style={styles.emptyBox}>
            <ActivityIndicator color="#6C63FF" />
            <Text style={styles.emptyText}>Подготвяме плана…</Text>
          </View>
        )}

        {slots.map(({ slot, products, status, recipeName, recipeDesc, recipeUrl }) => (
          <View key={slot.key} style={[styles.mealCard, { borderLeftColor: slot.color }]}>

            {/* Slot badge */}
            <View style={styles.mealCardHeader}>
              <View style={[styles.slotBadge, { backgroundColor: slot.color }]}>
                <Text style={styles.slotIcon}>{slot.icon}</Text>
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>
            </View>

            {status === 'loading' ? (
              /* Per-slot skeleton */
              <View style={styles.skeleton}>
                <ActivityIndicator color={slot.color} size="small" />
                <Text style={[styles.skeletonText, { color: slot.color }]}>
                  Търсим рецепта…
                </Text>
              </View>
            ) : (
              <>
                {/* Recipe name */}
                <Text style={styles.mealName}>
                  {recipeName || `Рецепта с ${products.map(cleanName).join(', ')}`}
                </Text>

                {/* Product pills */}
                <View style={styles.productsBox}>
                  <Text style={styles.productsLabel}>Основни продукти:</Text>
                  <View style={styles.productsList}>
                    {products.map((p) => (
                      <View key={p.id} style={[styles.productPill, { borderColor: slot.color }]}>
                        <Text style={styles.productPillIcon}>{getCategoryIcon(p.category)}</Text>
                        <Text style={[styles.productPillText, { color: slot.color }]}>
                          {cleanName(p.name)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Short description */}
                {recipeDesc ? (
                  <View style={styles.descBox}>
                    <Text style={styles.descText}>{recipeDesc}</Text>
                  </View>
                ) : null}

                {/* Link */}
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: slot.color }]}
                  onPress={() => Linking.openURL(recipeUrl).catch(() => {})}
                >
                  <Text style={styles.linkBtnText}>📖 Виж пълната рецепта</Text>
                </TouchableOpacity>
              </>
            )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  mealCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  mealCardHeader: { marginBottom: 12 },
  slotBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5,
  },
  slotIcon:  { fontSize: 13 },
  slotLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Per-slot skeleton */
  skeleton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12,
  },
  skeletonText: { fontSize: 14, fontWeight: '600' },

  mealName: {
    fontSize: 18, fontWeight: '800', color: '#1A1A2E',
    marginBottom: 12, lineHeight: 24,
  },

  productsBox:   { marginBottom: 12 },
  productsLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', marginBottom: 8 },
  productsList:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  productPillIcon: { fontSize: 14 },
  productPillText: { fontSize: 12, fontWeight: '700' },

  descBox: {
    backgroundColor: '#FFFBEA', borderRadius: 10,
    padding: 12, marginBottom: 12,
  },
  descText: { fontSize: 13, color: '#7d6608', lineHeight: 20 },

  linkBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#aaa' },

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
