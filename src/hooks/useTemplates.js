import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storage';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.BUDGET_TEMPLATES).then((raw) => {
      if (raw) setTemplates(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setTemplates(data);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_TEMPLATES, JSON.stringify(data));
  };

  const saveTemplate = async ({ name, store, items }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const next = [{ id, name, store, items, savedAt: Date.now() }, ...templates];
    await persist(next);
  };

  const deleteTemplate = async (id) => {
    await persist(templates.filter((t) => t.id !== id));
  };

  return { templates, saveTemplate, deleteTemplate };
}
