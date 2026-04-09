/**
 * Smart Budget Shopping — List Generation Logic
 *
 * Firestore product document shape expected:
 * {
 *   id: string,
 *   name: string,
 *   price: number,          // price per unit (BGN)
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
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const result = [];
  let spent = 0;
  const usedCategories = new Set();

  // First pass: one item per category (cheapest)
  for (const p of sorted) {
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      result.push({ ...p, quantity: 1 });
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Second pass: fill remaining budget with cheapest items (add quantity)
  for (const p of sorted) {
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const existing = result.find((r) => r.id === p.id);
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0) {
      if (existing) {
        existing.quantity += extraQty;
      } else {
        result.push({ ...p, quantity: extraQty });
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
  const healthy = products.filter((p) => p.isHealthy);
  const fallback = products.filter((p) => !p.isHealthy);

  // Sort healthy items: low calorie per BGN first (value health)
  const sorted = [
    ...healthy.sort((a, b) => (a.calories || 999) - (b.calories || 999)),
    ...fallback.sort((a, b) => a.price - b.price),
  ];

  const result = [];
  let spent = 0;
  const usedCategories = new Set();

  // One item per category, healthy first
  for (const p of sorted) {
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      result.push({ ...p, quantity: 1 });
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Fill remaining with healthy extras
  for (const p of healthy.sort((a, b) => a.price - b.price)) {
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const existing = result.find((r) => r.id === p.id);
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0 && p.price <= remaining) {
      if (existing) {
        existing.quantity += extraQty;
      } else {
        result.push({ ...p, quantity: extraQty });
      }
      spent += extraQty * p.price;
    }
  }

  return result;
}

/**
 * HIGH PROTEIN goal:
 * Sort by protein-per-BGN ratio (most protein per money spent).
 * Fill budget greedily.
 */
function buildHighProteinList(products, budget) {
  // Only consider products with meaningful protein (>= 5g per 100g)
  const proteinProducts = products.filter((p) => (p.protein || 0) >= 5);
  const others = products.filter((p) => (p.protein || 0) < 5);

  // protein per BGN = protein / price
  const sorted = [
    ...proteinProducts.sort(
      (a, b) => b.protein / b.price - a.protein / a.price
    ),
    ...others.sort((a, b) => a.price - b.price),
  ];

  const result = [];
  let spent = 0;
  const usedCategories = new Set();

  // One per category first
  for (const p of sorted) {
    if (spent + p.price <= budget && !usedCategories.has(p.category)) {
      result.push({ ...p, quantity: 1 });
      spent += p.price;
      usedCategories.add(p.category);
    }
  }

  // Add more high-protein items with remaining budget
  for (const p of proteinProducts.sort(
    (a, b) => b.protein / b.price - a.protein / a.price
  )) {
    const remaining = budget - spent;
    if (remaining <= 0) break;
    const extraQty = Math.floor(remaining / p.price);
    if (extraQty > 0) {
      const existing = result.find((r) => r.id === p.id);
      if (existing) {
        existing.quantity += extraQty;
      } else {
        result.push({ ...p, quantity: extraQty });
      }
      spent += extraQty * p.price;
    }
  }

  return result;
}

/**
 * Main entry point called from HomeScreen.
 */
export function generateList({ products, budget, goal, store }) {
  const pool = filterByStore(products, store);

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
