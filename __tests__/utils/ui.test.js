import { getCategoryIcon, CATEGORY_ICONS, GOAL_META } from '../../src/utils/ui';

describe('getCategoryIcon', () => {
  it('returns the correct emoji for known categories', () => {
    expect(getCategoryIcon('meat')).toBe('🥩');
    expect(getCategoryIcon('dairy')).toBe('🥛');
    expect(getCategoryIcon('fruit')).toBe('🍎');
    expect(getCategoryIcon('vegetables')).toBe('🥦');
  });

  it('is case-insensitive', () => {
    expect(getCategoryIcon('MEAT')).toBe('🥩');
    expect(getCategoryIcon('Dairy')).toBe('🥛');
  });

  it('returns the fallback cart emoji for unknown categories', () => {
    expect(getCategoryIcon('unknown')).toBe('🛒');
    expect(getCategoryIcon('')).toBe('🛒');
    expect(getCategoryIcon(undefined)).toBe('🛒');
    expect(getCategoryIcon(null)).toBe('🛒');
  });

  it('covers every key in CATEGORY_ICONS', () => {
    for (const [cat, emoji] of Object.entries(CATEGORY_ICONS)) {
      expect(getCategoryIcon(cat)).toBe(emoji);
    }
  });
});

describe('GOAL_META', () => {
  it('has entries for all three goals', () => {
    expect(GOAL_META).toHaveProperty('cheapest');
    expect(GOAL_META).toHaveProperty('healthy');
    expect(GOAL_META).toHaveProperty('high_protein');
  });

  it('each goal has label, icon, and color fields', () => {
    for (const meta of Object.values(GOAL_META)) {
      expect(typeof meta.label).toBe('string');
      expect(typeof meta.icon).toBe('string');
      expect(meta.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
