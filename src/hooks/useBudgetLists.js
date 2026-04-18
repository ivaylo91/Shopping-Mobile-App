import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useBudgetLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

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
    await addDoc(collection(db, 'budgetLists'), {
      userId: user.uid,
      name: name || 'Моят списък',
      budget,
      store,
      items,
      total,
      remaining: budget - total,
      createdAt: serverTimestamp(),
    });
  };

  const deleteList = async (id) => {
    await deleteDoc(doc(db, 'budgetLists', id));
  };

  return { lists, loading, error, saveList, deleteList };
}
