import { useEffect, useState } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { sendOverBudgetAlert } from './useNotifications';

let priceHistoryModule = null;
async function recordPricesAsync(items, store) {
  try {
    if (!priceHistoryModule) {
      priceHistoryModule = await import('./usePriceHistory');
    }
    // Fire-and-forget — we call the raw AsyncStorage write directly
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const KEY = '@price_history_v1';
    const MAX_PER_PRODUCT = 12;
    const raw = await AsyncStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    for (const item of items) {
      const key = item.name.toLowerCase();
      const existing = history[key] || [];
      history[key] = [{ price: item.price, store, date: now }, ...existing].slice(0, MAX_PER_PRODUCT);
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(history));
  } catch {}
}

export function useBudgetLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLists([]); setLoading(false); return; }

    const q = query(
      collection(db, 'budgetLists'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLists(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useBudgetLists error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const saveList = async ({ name, budget, store, items }) => {
    if (!user) throw new Error('Трябва да сте влезли в профила си');
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    const remaining = budget - total;

    await addDoc(collection(db, 'budgetLists'), {
      userId: user.uid,
      name: name || 'Моят списък',
      budget,
      store,
      items,
      total,
      remaining,
      createdAt: serverTimestamp(),
    });

    // Side effects (non-blocking)
    recordPricesAsync(items, store);
    if (remaining < 0) {
      sendOverBudgetAlert(name, Math.abs(remaining));
    }
  };

  const deleteList = async (id) => {
    await deleteDoc(doc(db, 'budgetLists', id));
  };

  return { lists, loading, error, saveList, deleteList };
}
