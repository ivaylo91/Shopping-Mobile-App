import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from '../utils/uid';

const USERS_KEY = '@auth_users_v1';
const SESSION_KEY = '@auth_session_v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => { if (raw) setUser(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const register = async (name, email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    if (users.find((u) => u.email === trimmedEmail)) {
      throw new Error('Имейлът вече е регистриран');
    }
    const newUser = { id: uid(), name: name.trim(), email: trimmedEmail, password };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    const session = { id: newUser.id, name: newUser.name, email: newUser.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    const found = users.find((u) => u.email === trimmedEmail && u.password === password);
    if (!found) throw new Error('Невалиден имейл или парола');
    const session = { id: found.id, name: found.name, email: found.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
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
