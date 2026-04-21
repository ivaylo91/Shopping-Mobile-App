import { generateMealPlan, generateSingleMeal, hasApiKey } from '../../src/services/mealAI';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PLAN = {
  breakfast: { title: 'Oats', desc: 'Quick oats.', fromList: [], extra: [], steps: ['Cook.'], calories: 300, protein: 10, carbs: 50, fat: 5, prepTime: 5 },
  lunch:     { title: 'Salad', desc: 'Fresh salad.', fromList: [], extra: [], steps: ['Mix.'],  calories: 200, protein: 5,  carbs: 20, fat: 8, prepTime: 10 },
  dinner:    { title: 'Pasta', desc: 'Simple pasta.', fromList: [], extra: [], steps: ['Boil.'], calories: 450, protein: 15, carbs: 70, fat: 10, prepTime: 20 },
  snack:     { title: 'Apple', desc: 'Fresh apple.', fromList: [], extra: [], steps: ['Eat.'],  calories: 80,  protein: 0,  carbs: 20, fat: 0, prepTime: 0 },
};

const VALID_MEAL = VALID_PLAN.breakfast;

const PRODUCTS = [
  { name: 'Milk',    category: 'dairy' },
  { name: 'Chicken', category: 'meat'  },
];

function mockFetchSuccess(payload) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ content: [{ text: JSON.stringify(payload) }] }),
  });
}

function mockFetchStream(text) {
  const lines = [
    `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } })}`,
    'data: [DONE]',
  ].join('\n');
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines));
      controller.close();
    },
  });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, body: { getReader: () => stream.getReader() } });
}

function mockFetchError(status = 500) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve('Internal error'),
  });
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = 'test-key-123';
  jest.clearAllMocks();
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
});

// ─── hasApiKey ────────────────────────────────────────────────────────────────

describe('hasApiKey', () => {
  it('returns true when the env var is set', () => {
    expect(hasApiKey()).toBe(true);
  });

  it('returns false when the env var is missing', () => {
    delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    expect(hasApiKey()).toBe(false);
  });
});

// ─── generateMealPlan ─────────────────────────────────────────────────────────

describe('generateMealPlan', () => {
  it('throws NO_API_KEY when key is missing', async () => {
    delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    await expect(generateMealPlan(PRODUCTS, {})).rejects.toThrow('NO_API_KEY');
  });

  it('returns a parsed meal plan object on success (non-streaming fallback)', async () => {
    mockFetchSuccess(VALID_PLAN);
    const result = await generateMealPlan(PRODUCTS, {});
    expect(result).toHaveProperty('breakfast');
    expect(result).toHaveProperty('lunch');
    expect(result).toHaveProperty('dinner');
    expect(result).toHaveProperty('snack');
  });

  it('calls the onChunk callback with streamed text', async () => {
    mockFetchStream(JSON.stringify(VALID_PLAN));
    const onChunk = jest.fn();
    await generateMealPlan(PRODUCTS, {}, onChunk);
    expect(onChunk).toHaveBeenCalled();
  });

  it('falls back to plain request when streaming fails', async () => {
    // First call (stream) rejects, second call (plain) succeeds
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('stream error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: JSON.stringify(VALID_PLAN) }] }),
      });
    const result = await generateMealPlan(PRODUCTS, {});
    expect(result).toHaveProperty('breakfast');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws on API error status', async () => {
    mockFetchError(401);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') })
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') });
    await expect(generateMealPlan(PRODUCTS, {})).rejects.toThrow('Claude API 401');
  });
});

// ─── generateSingleMeal ───────────────────────────────────────────────────────

describe('generateSingleMeal', () => {
  it('throws NO_API_KEY when key is missing', async () => {
    delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    await expect(generateSingleMeal(PRODUCTS, 'lunch')).rejects.toThrow('NO_API_KEY');
  });

  it('returns a parsed single meal object', async () => {
    mockFetchSuccess({ content: [{ text: JSON.stringify(VALID_MEAL) }] });
    // Non-streaming path
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: JSON.stringify(VALID_MEAL) }] }),
    });
    const result = await generateSingleMeal(PRODUCTS, 'breakfast', [], {});
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('steps');
    expect(Array.isArray(result.steps)).toBe(true);
  });

  it('accepts all valid slot keys', async () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack']) {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: JSON.stringify(VALID_MEAL) }] }),
      });
      await expect(generateSingleMeal(PRODUCTS, slot, [], {})).resolves.toBeDefined();
    }
  });
});
