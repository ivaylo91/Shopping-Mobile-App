import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@recurring_items_v1';

export function useRecurringItems() {
  const [recurring, setRecurring] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setRecurring(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setRecurring(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  };

  const addRecurring = async (item) => {
    const exists = recurring.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
    if (exists) return false;
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      category: item.category || 'other',
      note: item.note || '',
    };
    await persist([...recurring, entry]);
    return true;
  };

  const removeRecurring = async (name) => {
    await persist(recurring.filter((r) => r.name.toLowerCase() !== name.toLowerCase()));
  };

  const updateRecurring = async (id, updates) => {
    await persist(recurring.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const isRecurring = (name) =>
    recurring.some((r) => r.name.toLowerCase() === name.toLowerCase());

  return { recurring, addRecurring, removeRecurring, updateRecurring, isRecurring };
}
