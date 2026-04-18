import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@custom_stores_v1';
const DEFAULTS = ['Всички', 'Lidl', 'Kaufland', 'Billa', 'OMV', 'Fantastico'];

export function useCustomStores() {
  const [customs, setCustoms] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setCustoms(JSON.parse(raw));
    });
  }, []);

  const stores = [...DEFAULTS, ...customs];

  const addStore = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || stores.includes(trimmed)) return false;
    const next = [...customs, trimmed];
    setCustoms(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return true;
  };

  const removeStore = async (name) => {
    if (DEFAULTS.includes(name)) return;
    const next = customs.filter((s) => s !== name);
    setCustoms(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  return { stores, customs, addStore, removeStore };
}
