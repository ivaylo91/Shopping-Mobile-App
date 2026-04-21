import { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT, DARK, SHADOWS, getShadows } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  // null = follow system, 'light' or 'dark' = manual override
  const [override, setOverride] = useState(null);

  const isDark = override ? override === 'dark' : systemScheme === 'dark';
  const colors = isDark ? DARK : LIGHT;
  const shadows = getShadows(isDark);

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const setTheme = useCallback((scheme) => setOverride(scheme), []);

  return (
    <ThemeContext.Provider value={{ isDark, colors, shadows, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
