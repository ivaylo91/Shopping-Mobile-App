/**
 * mealAI — Claude API integration for dynamic recipe generation.
 * Uses streaming for progressive UI updates (perceived 3x speed increase).
 * Requires: EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

function getKey() {
  return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
}

function filterText(filters = {}) {
  const constraints = [];
  if (filters.vegetarian)  constraints.push('всички рецепти трябва да са ВЕГЕТАРИАНСКИ (без месо и риба)');
  if (filters.quick)       constraints.push('всички рецепти трябва да се приготвят за ≤25 минути');
  if (filters.highProtein) constraints.push('всички рецепти трябва да са богати на протеин (≥30г на порция)');
  return constraints.length
    ? `\nДопълнителни изисквания: ${constraints.join('; ')}.`
    : '';
}

function parseJSON(raw) {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean);
}

/**
 * Collect a streaming SSE response and return the full text.
 * Calls onChunk(partialText) progressively as data arrives.
 */
async function streamRequest(body, onChunk) {
  const key = getKey();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const evt = JSON.parse(data);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          full += evt.delta.text;
          onChunk?.(full);
        }
      } catch { /* ignore malformed SSE lines */ }
    }
  }

  return full;
}

/**
 * Non-streaming fallback for environments that don't support ReadableStream.
 */
async function plainRequest(body) {
  const key = getKey();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

/**
 * Generate a full 4-meal day plan.
 * @param {Array}  products  - items with { name, category }
 * @param {Object} filters   - { vegetarian, quick, highProtein }
 * @param {Function} onChunk - called with partial raw text as it streams
 */
export async function generateMealPlan(products, filters = {}, onChunk) {
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
  "lunch":   { },
  "dinner":  { },
  "snack":   { }
}`;

  const body = {
    model: MODEL,
    max_tokens: 2400,
    messages: [{ role: 'user', content: prompt }],
  };

  let raw;
  try {
    raw = await streamRequest(body, onChunk);
  } catch {
    raw = await plainRequest(body);
  }

  return parseJSON(raw);
}

/**
 * Regenerate a single meal slot.
 */
export async function generateSingleMeal(products, slotKey, excludeTitles = [], filters = {}, onChunk) {
  const key = getKey();
  if (!key) throw new Error('NO_API_KEY');

  const SLOT_BG = { breakfast: 'закуска', lunch: 'обяд', dinner: 'вечеря', snack: 'снак' };

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

  const body = {
    model: MODEL,
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  };

  let raw;
  try {
    raw = await streamRequest(body, onChunk);
  } catch {
    raw = await plainRequest(body);
  }

  return parseJSON(raw);
}

export function hasApiKey() {
  return !!getKey();
}
