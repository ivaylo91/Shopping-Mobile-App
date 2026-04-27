import { useEffect, useState } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { sendOverBudgetAlert } from './useNotifications';
import { PRICE_HISTORY_KEY, MAX_HISTORY_PER_PRODUCT } from './usePriceHistory';

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
