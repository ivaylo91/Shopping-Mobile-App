import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useOrders snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, tick]);

  const placeOrder = async (cart, total, goal = null, store = null) => {
    if (!user) throw new Error('Трябва да сте влезли в профила си');
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      items: cart,
      total,
      goal,
      store,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  };

  return { orders, loading, error, placeOrder, refresh };
}
