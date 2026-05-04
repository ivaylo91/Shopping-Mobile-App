import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from '../utils/uid';
import { PRICE_HISTORY_KEY, MAX_HISTORY_PER_PRODUCT } from './usePriceHistory';

const LISTS_KEY = '@budget_lists_v2';
const MAX_TRACKED_PRODUCTS = 200;

async function recordPricesAsync(items, store) {
  try {
    const raw = await AsyncStorage.getItem(PRICE_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    for (const item of items) {
      const key = item.name.toLowerCase();
      const existing = history[key] || [];
      history[key] = [{ price: item.price, store, date: now }, ...existing].slice(0, MAX_HISTORY_PER_PRODUCT);
    }
    const keys = Object.keys(history);
    if (keys.length > MAX_TRACKED_PRODUCTS) {
      keys
        .sort((a, b) => (history[b][0]?.date ?? 0) - (history[a][0]?.date ?? 0))
        .slice(MAX_TRACKED_PRODUCTS)
        .forEach((k) => delete history[k]);
    }
    await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function useBudgetLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(LISTS_KEY);
      setLists(raw ? JSON.parse(raw) : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveList = useCallback(async ({ name, budget, store, items }) => {
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const newList = {
      id: uid(),
      name: name || 'Моят списък',
      budget,
      store,
      items,
      total,
      remaining: budget - total,
      createdAt: new Date().toISOString(),
    };
    const raw = await AsyncStorage.getItem(LISTS_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const updated = [newList, ...current];
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
    setLists(updated);
    recordPricesAsync(items, store);
  }, []);

  const deleteList = useCallback(async (id) => {
    const raw = await AsyncStorage.getItem(LISTS_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const updated = current.filter((l) => l.id !== id);
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
    setLists(updated);
  }, []);

  const refresh = useCallback(() => { load(); }, [load]);

  return { lists, loading, saveList, deleteList, refresh };
}
