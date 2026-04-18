import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@price_history_v1';
const MAX_PER_PRODUCT = 12;

export function usePriceHistory() {
  const [history, setHistory] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setHistory(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  };

  // Record prices for all items in a saved list
  const recordPrices = async (items, store) => {
    const next = { ...history };
    const now = Date.now();
    for (const item of items) {
      const key = item.name.toLowerCase();
      const existing = next[key] || [];
      next[key] = [{ price: item.price, store, date: now }, ...existing].slice(0, MAX_PER_PRODUCT);
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
