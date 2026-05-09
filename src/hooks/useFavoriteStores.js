import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storage';

export function useFavoriteStores() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_STORES).then((raw) => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setFavorites(data);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_STORES, JSON.stringify(data));
  };

  const toggleFavorite = async (store) => {
    if (favorites.includes(store)) {
      await persist(favorites.filter((s) => s !== store));
    } else {
      await persist([...favorites, store]);
    }
  };

  const isFavorite = useCallback((store) => favorites.includes(store), [favorites]);

  const sortStores = useCallback((stores) => [
    ...stores.filter((s) => favorites.includes(s)),
    ...stores.filter((s) => !favorites.includes(s)),
  ], [favorites]);

  return { favorites, toggleFavorite, isFavorite, sortStores };
}
