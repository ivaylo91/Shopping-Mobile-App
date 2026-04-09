import { useEffect, useState } from 'react';
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const placeOrder = async (cart, total) => {
    if (!user) throw new Error('Must be logged in to place an order');
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      items: cart,
      total,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  };

  return { orders, loading, placeOrder };
}
