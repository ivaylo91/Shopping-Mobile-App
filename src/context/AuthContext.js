import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);

const GUEST_USER = { uid: 'guest', email: 'guest@test.com', isGuest: true };
const ADMIN_EMAILS = ['ipenev91@gmail.com'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — if Firebase doesn't respond in 10s, stop loading
    const timeout = setTimeout(() => setLoading(false), 10000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      setUser((prev) => (prev?.isGuest ? prev : firebaseUser));
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => {
    setUser(null);
    return signOut(auth).catch(() => {});
  };

  const loginAsGuest = () => setUser(GUEST_USER);

  const isAdmin = !!user && !user.isGuest && ADMIN_EMAILS.includes(user.email);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, loginAsGuest, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
