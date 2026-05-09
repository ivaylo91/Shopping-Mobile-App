import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from '../utils/uid';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../config/storage';

export function useBudgetLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_LISTS);
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
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_LISTS);
    const current = raw ? JSON.parse(raw) : [];
    
    // Cleanup old lists if over limit
    let updated = [newList, ...current];
    if (updated.length > STORAGE_LIMITS.MAX_SAVED_LISTS) {
      updated = updated.slice(0, STORAGE_LIMITS.MAX_SAVED_LISTS);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_LISTS, JSON.stringify(updated));
    setLists(updated);

    // Update price history (optimized: usePriceHistory should ideally handle this, 
    // but we can do it here for now to avoid redundant hook complexity if needed)
    try {
      const rawHistory = await AsyncStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
      const history = rawHistory ? JSON.parse(rawHistory) : {};
      const now = Date.now();
      for (const item of items) {
        const key = item.name.toLowerCase();
        const existing = history[key] || [];
        history[key] = [{ price: item.price, store, date: now }, ...existing].slice(0, STORAGE_LIMITS.MAX_PRICE_HISTORY_PER_PRODUCT);
      }
      const keys = Object.keys(history);
      if (keys.length > STORAGE_LIMITS.MAX_TRACKED_PRODUCTS) {
        keys
          .sort((a, b) => (history[b][0]?.date ?? 0) - (history[a][0]?.date ?? 0))
          .slice(STORAGE_LIMITS.MAX_TRACKED_PRODUCTS)
          .forEach((k) => delete history[k]);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(history));
    } catch {}
  }, []);

  const deleteList = useCallback(async (id) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_LISTS);
    const current = raw ? JSON.parse(raw) : [];
    const updated = current.filter((l) => l.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_LISTS, JSON.stringify(updated));
    setLists(updated);
  }, []);

  const refresh = useCallback(() => { load(); }, [load]);

  return { lists, loading, saveList, deleteList, refresh };
}
