import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from '../utils/uid';
import { STORAGE_KEYS } from '../config/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION)
      .then((raw) => { if (raw) setUser(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const register = async (name, email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USERS);
    const users = raw ? JSON.parse(raw) : [];
    if (users.find((u) => u.email === trimmedEmail)) {
      throw new Error('Имейлът вече е регистриран');
    }
    const newUser = { id: uid(), name: name.trim(), email: trimmedEmail, password };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USERS, JSON.stringify([...users, newUser]));
    const session = { id: newUser.id, name: newUser.name, email: newUser.email };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    setUser(session);
  };

  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USERS);
    const users = raw ? JSON.parse(raw) : [];
    const found = users.find((u) => u.email === trimmedEmail && u.password === password);
    if (!found) throw new Error('Невалиден имейл или парола');
    const session = { id: found.id, name: found.name, email: found.email };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    setUser(session);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
