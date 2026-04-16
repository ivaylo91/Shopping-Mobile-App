/**
 * mealAI — Claude API integration for dynamic recipe generation.
 *
 * Generates meal plans and individual recipes based on the actual
 * shopping list products. Recipes are returned in Bulgarian and
 * include ingredients, step-by-step instructions, and macros.
 *
 * Requires: EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-haiku-4-5-20251001';

function getKey() {
  return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
}

/** Build the filter constraint string passed to the AI */
function filterText(filters = {}) {
  const constraints = [];
  if (filters.vegetarian)  constraints.push('всички рецепти трябва да са ВЕГЕТАРИАНСКИ (без месо и риба)');
  if (filters.quick)       constraints.push('всички рецепти трябва да се приготвят за ≤25 минути');
  if (filters.highProtein) constraints.push('всички рецепти трябва да са богати на протеин (≥30г на порция)');
  return constraints.length
    ? `\nДопълнителни изисквания: ${constraints.join('; ')}.`
    : '';
}

/** Parse and validate the JSON Claude returns */
function parseJSON(raw) {
  // Strip any accidental markdown code fences
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean);
}

/**
 * Generate a full 4-meal day plan (breakfast / lunch / dinner / snack).
 * @param {Array}  products - shopping list items with { name, category }
 * @param {Object} filters  - { vegetarian, quick, highProtein }
 */
export async function generateMealPlan(products, filters = {}) {
  const key = getKey();
  if (!key) throw new Error('NO_API_KEY');

  const productList = products
    .slice(0, 35)
    .map((p) => `- ${p.name} (${p.category ?? 'различни'})`)
    .join('\n');

  const prompt = `Ти си кулинарен асистент. Даден е следният списък с продукти за пазаруване:

${productList}
${filterText(filters)}

Генерирай 4 рецепти на БЪЛГАРСКИ език — закуска, обяд, вечеря и снак.
Използвай максимално продуктите от списъка.

Отговори САМО с валиден JSON (без markdown обвивки, без коментари):
{
  "breakfast": {
    "title": "Заглавие на рецептата",
    "desc": "Едно кратко изречение описание.",
    "fromList": ["точно_наименование_от_горния_списък"],
    "extra": ["допълнителна съставка извън списъка"],
    "steps": ["Стъпка 1.", "Стъпка 2.", "Стъпка 3."],
    "calories": 350,
    "protein": 20,
    "carbs": 40,
    "fat": 12,
    "prepTime": 15
  },
  "lunch":   { /* same shape */ },
  "dinner":  { /* same shape */ },
  "snack":   { /* same shape */ }
}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return parseJSON(data.content[0].text);
}

/**
 * Regenerate a single meal slot (used by the swap button).
 * @param {Array}  products      - shopping list items
 * @param {string} slotKey       - 'breakfast' | 'lunch' | 'dinner' | 'snack'
 * @param {Array}  excludeTitles - recipe titles already shown for this slot
 * @param {Object} filters
 */
export async function generateSingleMeal(products, slotKey, excludeTitles = [], filters = {}) {
  const key = getKey();
  if (!key) throw new Error('NO_API_KEY');

  const SLOT_BG = {
    breakfast: 'закуска',
    lunch:     'обяд',
    dinner:    'вечеря',
    snack:     'снак',
  };

  const productList = products
    .slice(0, 35)
    .map((p) => `- ${p.name} (${p.category ?? 'различни'})`)
    .join('\n');

  const excludeClause = excludeTitles.length
    ? `\nНЕ предлагай следните рецепти (вече показани): ${excludeTitles.map((t) => `"${t}"`).join(', ')}.`
    : '';

  const prompt = `Ти си кулинарен асистент. Даден е следният списък с продукти:

${productList}
${filterText(filters)}${excludeClause}

Генерирай 1 НОВА рецепта за ${SLOT_BG[slotKey]} на БЪЛГАРСКИ, която използва тези продукти.

Отговори САМО с валиден JSON (без markdown):
{
  "title": "Заглавие",
  "desc": "Едно изречение.",
  "fromList": ["точно_наименование_от_горния_списък"],
  "extra": ["допълнителна съставка"],
  "steps": ["Стъпка 1.", "Стъпка 2.", "Стъпка 3."],
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "prepTime": 0
}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return parseJSON(data.content[0].text);
}

/** True if an API key is configured */
export function hasApiKey() {
  return !!getKey();
}
