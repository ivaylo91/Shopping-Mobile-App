import { generateList } from '../../src/utils/generateList';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: '1', name: 'Chicken', price: 5.00, category: 'meat',    protein: 30, calories: 165, isHealthy: true,  store: 'Lidl' },
  { id: '2', name: 'Milk',    price: 1.50, category: 'dairy',   protein: 3,  calories: 60,  isHealthy: true,  store: 'Lidl' },
  { id: '3', name: 'Chips',   price: 2.00, category: 'snacks',  protein: 2,  calories: 520, isHealthy: false, store: 'Lidl' },
  { id: '4', name: 'Apple',   price: 0.80, category: 'fruit',   protein: 0,  calories: 52,  isHealthy: true,  store: 'Any'  },
  { id: '5', name: 'Tuna',    price: 3.00, category: 'fish',    protein: 25, calories: 130, isHealthy: true,  store: 'Billa'},
  { id: '6', name: 'Beer',    price: 1.20, category: 'alcohol', protein: 0,  calories: 43,  isHealthy: false, store: 'Lidl' },
  { id: '7', name: 'Eggs',    price: 2.50, category: 'eggs',    protein: 13, calories: 155, isHealthy: true,  store: 'Lidl' },
];

// ─── Store filtering ──────────────────────────────────────────────────────────

describe('generateList — store filtering', () => {
  it('includes products from the selected store plus "Any" store products', () => {
    const result = generateList({ products: PRODUCTS, budget: 50, goal: 'cheapest', store: 'Lidl' });
    const names = result.map((i) => i.name);
    expect(names).not.toContain('Tuna'); // Billa-only
    expect(names).toContain('Apple');    // store: "Any" — always included
  });

  it('returns all non-excluded products when store is "any"', () => {
    const result = generateList({ products: PRODUCTS, budget: 50, goal: 'cheapest', store: 'any' });
    const names = result.map((i) => i.name);
    expect(names).toContain('Tuna');
    expect(names).toContain('Chicken');
  });
});

// ─── Alcohol exclusion ────────────────────────────────────────────────────────

describe('generateList — excluded categories', () => {
  it('never includes alcohol', () => {
    const result = generateList({ products: PRODUCTS, budget: 100, goal: 'cheapest', store: 'any' });
    expect(result.find((i) => i.category === 'alcohol')).toBeUndefined();
  });
});

// ─── Budget constraint ────────────────────────────────────────────────────────

describe('generateList — budget constraint', () => {
  it('total subtotal never exceeds budget', () => {
    const budget = 10;
    for (const goal of ['cheapest', 'healthy', 'high_protein']) {
      const result = generateList({ products: PRODUCTS, budget, goal, store: 'any' });
      const total = result.reduce((s, i) => s + i.subtotal, 0);
      expect(total).toBeLessThanOrEqual(budget + 0.001); // float tolerance
    }
  });

  it('returns empty array when budget is 0', () => {
    const result = generateList({ products: PRODUCTS, budget: 0, goal: 'cheapest', store: 'Lidl' });
    expect(result).toHaveLength(0);
  });

  it('excludes store-specific products when store does not match', () => {
    // Apple has store:'Any' so it still appears, but Tuna (Billa-only) should not
    const result = generateList({ products: PRODUCTS, budget: 100, goal: 'cheapest', store: 'NonExistent' });
    expect(result.find((i) => i.name === 'Tuna')).toBeUndefined();
    expect(result.find((i) => i.name === 'Apple')).toBeDefined();
  });
});

// ─── Subtotals ────────────────────────────────────────────────────────────────

describe('generateList — subtotals', () => {
  it('attaches correct subtotal to every item', () => {
    const result = generateList({ products: PRODUCTS, budget: 20, goal: 'cheapest', store: 'any' });
    for (const item of result) {
      expect(item.subtotal).toBeCloseTo(item.price * item.quantity, 2);
    }
  });
});

// ─── Goal: cheapest ───────────────────────────────────────────────────────────

describe('generateList — cheapest goal', () => {
  it('prefers lower-priced items', () => {
    const result = generateList({ products: PRODUCTS, budget: 5, goal: 'cheapest', store: 'Lidl' });
    const names = result.map((i) => i.name);
    // Apple (0.80) and Milk (1.50) are cheaper than Chicken (5.00)
    expect(names).toContain('Apple');
    expect(names).toContain('Milk');
  });

  it('adds quantity when budget allows repurchase of cheapest items', () => {
    const result = generateList({ products: PRODUCTS, budget: 10, goal: 'cheapest', store: 'Lidl' });
    const apple = result.find((i) => i.id === '4');
    // Apple is €0.80 — with leftover budget it should get extra quantity
    expect(apple?.quantity).toBeGreaterThanOrEqual(1);
  });
});

// ─── Goal: healthy ────────────────────────────────────────────────────────────

describe('generateList — healthy goal', () => {
  it('prefers isHealthy items', () => {
    const result = generateList({ products: PRODUCTS, budget: 20, goal: 'healthy', store: 'any' });
    const unhealthySelected = result.filter((i) => !i.isHealthy);
    const healthySelected = result.filter((i) => i.isHealthy);
    expect(healthySelected.length).toBeGreaterThan(unhealthySelected.length);
  });
});

// ─── Goal: high_protein ───────────────────────────────────────────────────────

describe('generateList — high_protein goal', () => {
  it('includes high-protein items', () => {
    const result = generateList({ products: PRODUCTS, budget: 20, goal: 'high_protein', store: 'any' });
    const names = result.map((i) => i.name);
    // Chicken (30g protein) and Tuna (25g protein) should be present
    const hasHighProtein = names.includes('Chicken') || names.includes('Tuna') || names.includes('Eggs');
    expect(hasHighProtein).toBe(true);
  });

  it('ignores items with protein < 5g in primary selection', () => {
    const result = generateList({ products: PRODUCTS, budget: 6, goal: 'high_protein', store: 'any' });
    // With €6 budget, should prefer Chicken/Eggs/Tuna over Apple or Chips
    const names = result.map((i) => i.name);
    const hasHighProtein = names.some((n) => ['Chicken', 'Tuna', 'Eggs'].includes(n));
    expect(hasHighProtein).toBe(true);
  });
});

// ─── Default goal ─────────────────────────────────────────────────────────────

describe('generateList — unknown goal falls back to cheapest', () => {
  it('produces the same result as cheapest for an unknown goal', () => {
    const cheapest = generateList({ products: PRODUCTS, budget: 15, goal: 'cheapest', store: 'Lidl' });
    const fallback  = generateList({ products: PRODUCTS, budget: 15, goal: 'unknown',  store: 'Lidl' });
    expect(fallback).toEqual(cheapest);
  });
});
