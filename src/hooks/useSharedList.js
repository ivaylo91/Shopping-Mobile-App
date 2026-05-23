import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../config/firebase';
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, arrayUnion,
} from 'firebase/firestore';

function generateShareCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useSharedList() {
  const [sharedList, setSharedList] = useState(null);
  const [shareCode, setShareCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const subscribeToList = useCallback((code) => {
    if (unsubRef.current) unsubRef.current();
    const docRef = doc(db, 'sharedLists', code);
    unsubRef.current = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setSharedList({ id: snap.id, ...snap.data() });
    }, () => {});
  }, []);

  const createSharedList = useCallback(async ({ name, budget, store, items }, user) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateShareCode();
      await setDoc(doc(db, 'sharedLists', code), {
        name: name || 'Споделен списък',
        budget,
        store,
        items: items.map((i) => ({ ...i, addedBy: user.name })),
        members: [{ id: user.id, name: user.name }],
        createdBy: { id: user.id, name: user.name },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShareCode(code);
      subscribeToList(code);
      return code;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [subscribeToList]);

  const joinSharedList = useCallback(async (code, user) => {
    setLoading(true);
    setError(null);
    try {
      const trimCode = code.trim().toUpperCase();
      const docRef = doc(db, 'sharedLists', trimCode);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Списъкът не е намерен. Провери кода.');
      await updateDoc(docRef, {
        members: arrayUnion({ id: user.id, name: user.name }),
      });
      setShareCode(trimCode);
      subscribeToList(trimCode);
      return snap.data();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [subscribeToList]);

  const updateItems = useCallback(async (code, items, user) => {
    try {
      await updateDoc(doc(db, 'sharedLists', code), {
        items: items.map((i) => ({ ...i, addedBy: i.addedBy || user.name })),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setSharedList(null);
    setShareCode(null);
    setError(null);
  }, []);

  return { sharedList, shareCode, loading, error, createSharedList, joinSharedList, updateItems, disconnect };
}
