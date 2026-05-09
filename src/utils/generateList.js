/**
 * Smart Budget Shopping — List Generation Logic
 *
 * Firestore product document shape expected:
 * {
 *   id: string,
 *   name: string,
 *   price: number,          // price per unit (EUR)
 *   unit: string,           // e.g. "kg", "piece", "500g"
 *   store: string,          // "Lidl" | "Kaufland" | "Billa" | "Any"
 *   category: string,       // "meat" | "dairy" | "vegetables" | "fruit" | "grains" | "snacks" | ...
 *   protein: number,        // grams of protein per 100g (0 if N/A)
 *   calories: number,       // kcal per 100g (0 if N/A)
 *   isHealthy: boolean,     // manually tagged by admin
 *   imageUrl: string,
 * }
 */

/**
 * Filter products by selected store.
 * Store "any" means accept products from all stores.
 * Products tagged "Any" appear in all store filters.
 */
function filterByStore(products, store) {
  if (store === 'any') return products;
  return products.filter(
    (p) => p.store === store || p.store === 'Any' || p.store === 'any'
  );
}

/**
 * CHEAPEST goal:
 * Greedy — sort by price ascending, pick as many different items as possible
 * within budget, prefer variety across categories.
 */
function buildCheapestList(products, budget) {
  // Sort once and cache
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const result = [];
  let spent = 0;
  const usedCategories = new Set();
  const idMap = new Map();

  // First pass: one item per category (cheapest)
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      const item = { ...p, quantity: 1 };
      result.push(item);
      idMap.set(p.id, item);
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Second pass: fill remaining budget with cheapest items (add quantity)
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (!p.price) continue;
    const remaining = budget - spent;
    if (remaining <= 0) break;
    
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0) {
      const existing = idMap.get(p.id);
      if (existing) {
        existing.quantity += extraQty;
      } else {
        const item = { ...p, quantity: extraQty };
        result.push(item);
        idMap.set(p.id, item);
      }
      spent += extraQty * p.price;
    }
  }

  return result;
}

/**
 * HEALTHY goal:
 * Prioritize isHealthy === true, then balance across categories.
 * Avoid duplicating categories unless budget allows extras.
 */
function buildHealthyList(products, budget) {
  const healthy = [];
  const fallback = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].isHealthy) healthy.push(products[i]);
    else fallback.push(products[i]);
  }

  // Sort healthy items: low calorie first (value health)
  healthy.sort((a, b) => (a.calories || 999) - (b.calories || 999));
  fallback.sort((a, b) => a.price - b.price);

  const sorted = [...healthy, ...fallback];

  const result = [];
  let spent = 0;
  const usedCategories = new Set();
  const idMap = new Map();

  // One item per category, healthy first
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      const item = { ...p, quantity: 1 };
      result.push(item);
      idMap.set(p.id, item);
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Fill remaining with healthy extras
  const healthySortedByPrice = healthy.filter((p) => p.price > 0).sort((a, b) => a.price - b.price);
  for (let i = 0; i < healthySortedByPrice.length; i++) {
    const p = healthySortedByPrice[i];
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0) {
      const existing = idMap.get(p.id);
      if (existing) {
        existing.quantity += extraQty;
      } else {
        const item = { ...p, quantity: extraQty };
        result.push(item);
        idMap.set(p.id, item);
      }
      spent += extraQty * p.price;
    }
  }

  return result;
}

/**
 * HIGH PROTEIN goal:
 * Sort by protein-per-EUR ratio (most protein per money spent).
 * Fill budget greedily.
 */
function buildHighProteinList(products, budget) {
  const proteinProducts = [];
  const others = [];
  for (let i = 0; i < products.length; i++) {
    if ((products[i].protein || 0) >= 5) proteinProducts.push(products[i]);
    else others.push(products[i]);
  }

  // Cache sort by protein/price ratio (guard zero price)
  const proteinSortedByRatio = proteinProducts
    .filter((p) => p.price > 0)
    .sort((a, b) => b.protein / b.price - a.protein / a.price);

  others.sort((a, b) => a.price - b.price);
  const sorted = [...proteinSortedByRatio, ...others];

  const result = [];
  let spent = 0;
  const usedCategories = new Set();
  const idMap = new Map();

  // One per category first
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      const item = { ...p, quantity: 1 };
      result.push(item);
      idMap.set(p.id, item);
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Add more high-protein items
  for (let i = 0; i < proteinSortedByRatio.length; i++) {
    const p = proteinSortedByRatio[i];
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0) {
      const existing = idMap.get(p.id);
      if (existing) {
        existing.quantity += extraQty;
      } else {
        const item = { ...p, quantity: extraQty };
        result.push(item);
        idMap.set(p.id, item);
      }
      spent += extraQty * p.price;
    }
  }

  return result;
}

/**
 * Main entry point called from HomeScreen.
 */
const EXCLUDED_CATEGORIES = new Set(['alcohol']);

export function generateList({ products, budget, goal, store }) {
  const pool = filterByStore(products, store).filter(
    (p) => !EXCLUDED_CATEGORIES.has(p.category?.toLowerCase())
  );

  if (pool.length === 0) return [];

  let list;
  switch (goal) {
    case 'cheapest':
      list = buildCheapestList(pool, budget);
      break;
    case 'healthy':
      list = buildHealthyList(pool, budget);
      break;
    case 'high_protein':
      list = buildHighProteinList(pool, budget);
      break;
    default:
      list = buildCheapestList(pool, budget);
  }

  // Attach subtotals
  return list.map((item) => ({
    ...item,
    subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
  }));
}
