import { uid } from '../../src/utils/uid';

describe('uid', () => {
  it('returns a non-empty string', () => {
    expect(typeof uid()).toBe('string');
    expect(uid().length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 1000 }, uid));
    expect(ids.size).toBe(1000);
  });

  it('contains only alphanumeric characters', () => {
    expect(uid()).toMatch(/^[a-z0-9]+$/);
  });
});
