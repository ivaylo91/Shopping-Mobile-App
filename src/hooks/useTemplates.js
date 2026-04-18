import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@budget_templates_v1';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setTemplates(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setTemplates(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
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
