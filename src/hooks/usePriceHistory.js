import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRICE_HISTORY_KEY = '@price_history_v1';
export const MAX_HISTORY_PER_PRODUCT = 12;
const MAX_TRACKED_PRODUCTS = 200;

export function usePriceHistory() {
  const [history, setHistory] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(PRICE_HISTORY_KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setHistory(data);
    await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(data));
  };

  // Record prices for all items in a saved list
  const recordPrices = async (items, store) => {
    const next = { ...history };
    const now = Date.now();
    for (const item of items) {
      const key = item.name.toLowerCase();
      const existing = next[key] || [];
      next[key] = [{ price: item.price, store, date: now }, ...existing].slice(0, MAX_HISTORY_PER_PRODUCT);
    }
    // Evict least-recently-updated keys if over the cap
    const keys = Object.keys(next);
    if (keys.length > MAX_TRACKED_PRODUCTS) {
      keys
        .sort((a, b) => (next[b][0]?.date ?? 0) - (next[a][0]?.date ?? 0))
        .slice(MAX_TRACKED_PRODUCTS)
        .forEach((k) => delete next[k]);
    }
    await persist(next);
  };

  // Get price trend info for a product name
  const getPriceInfo = (name) => {
    const entries = history[name?.toLowerCase()];
    if (!entries || entries.length === 0) return null;
    const prices = entries.map((e) => e.price);
    const current = prices[0];
    const previous = prices[1] ?? null;
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const trend =
      previous === null ? 'new'
      : current < previous ? 'down'
      : current > previous ? 'up'
      : 'same';
    const thisWeek = entries.filter((e) => Date.now() - e.date < 7 * 86400000);
    const lastWeek = entries.filter(
      (e) => Date.now() - e.date >= 7 * 86400000 && Date.now() - e.date < 14 * 86400000
    );
    const avgThis = thisWeek.length ? thisWeek.reduce((s, e) => s + e.price, 0) / thisWeek.length : null;
    const avgLast = lastWeek.length ? lastWeek.reduce((s, e) => s + e.price, 0) / lastWeek.length : null;
    return { current, previous, lowest, highest, trend, avgThis, avgLast, count: entries.length, entries };
  };

  return { history, recordPrices, getPriceInfo };
}
