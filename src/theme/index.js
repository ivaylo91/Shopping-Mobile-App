// ─── Design Tokens ────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FONT = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  xxxl: 22,
  display: 28,
};

// ─── Color Palettes ────────────────────────────────────────────────────────────

const LIGHT = {
  primary: '#6C63FF',
  primaryLight: '#F0EEFF',
  primaryMuted: '#9b96d4',
  bg: '#F7F8FC',
  card: '#FFFFFF',
  cardAlt: '#F7F8FC',
  text: '#1A1A2E',
  textSecondary: '#666',
  textTertiary: '#999',
  textQuaternary: '#bbb',
  border: '#EEEEEE',
  borderLight: '#F4F4F8',
  green: '#2ecc71',
  greenLight: '#E8FBF0',
  red: '#e74c3c',
  redLight: '#FEF0EE',
  orange: '#f39c12',
  orangeLight: '#FEF9EE',
  blue: '#3498db',
  purple: '#9b59b6',
  overlay: 'rgba(0,0,0,0.4)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#ECECF4',
  statusBar: 'dark-content',
  inputBg: '#FFFFFF',
  shimmer1: '#F0F0F8',
  shimmer2: '#E8E8F4',
  skeleton: '#E0E0EA',
};

const DARK = {
  primary: '#8B7FFF',
  primaryLight: '#1E1B3A',
  primaryMuted: '#6B64C0',
  bg: '#0F0F1A',
  card: '#1A1A2E',
  cardAlt: '#12121F',
  text: '#F0F0FF',
  textSecondary: '#AAA8CC',
  textTertiary: '#7775A8',
  textQuaternary: '#555380',
  border: '#2A2845',
  borderLight: '#1F1E35',
  green: '#27ae60',
  greenLight: '#0D2B1A',
  red: '#c0392b',
  redLight: '#2B0D0D',
  orange: '#d68910',
  orangeLight: '#2B1D06',
  blue: '#2980b9',
  purple: '#8e44ad',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#1A1A2E',
  tabBarBorder: '#2A2845',
  statusBar: 'light-content',
  inputBg: '#1A1A2E',
  shimmer1: '#22203A',
  shimmer2: '#2A2848',
  skeleton: '#2A2845',
};

export const COLORS = LIGHT;

export { LIGHT, DARK };

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  primary: {
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export function getShadows(isDark) {
  if (isDark) return {
    sm:      { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
    md:      { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
    primary: { shadowColor: '#6C63FF', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  };
  return SHADOWS;
}
