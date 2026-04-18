import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@favorite_stores_v1';

export function useFavoriteStores() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  const persist = async (data) => {
    setFavorites(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  };

  const toggleFavorite = async (store) => {
    if (favorites.includes(store)) {
      await persist(favorites.filter((s) => s !== store));
    } else {
      await persist([...favorites, store]);
    }
  };

  const isFavorite = (store) => favorites.includes(store);

  // Sort stores: favorites first, then rest
  const sortStores = (stores) => [
    ...stores.filter((s) => favorites.includes(s)),
    ...stores.filter((s) => !favorites.includes(s)),
  ];

  return { favorites, toggleFavorite, isFavorite, sortStores };
}
