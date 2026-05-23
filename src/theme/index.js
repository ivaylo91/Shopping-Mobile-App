// ─── Design Tokens ────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Semantic layout aliases
  tight: 6,
  gutter: 16,
  content: 20,
  section: 28,
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
  // New
  label: 10,   // uppercase caps labels
  jumbo: 36,   // display numbers (totals, KPIs)
};

export const FONT_FAMILY = {
  light: 'Figtree_300Light',
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semiBold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extraBold: 'Figtree_800ExtraBold',
  black: 'Figtree_900Black',
};

// ─── Color Palettes ────────────────────────────────────────────────────────────

const LIGHT = {
  primary: '#c64e2e',         // terracotta accent — Cozy design accent color
  primaryLight: '#f8d9cd',    // accentSoft — warm blush tint
  primaryMuted: '#e8a090',    // muted terracotta for secondary elements
  bg: '#f6efe3',              // canvas — warm cream (Cozy design)
  card: '#fffaf0',            // surface — cream white card
  cardAlt: '#f0e6d2',         // surfaceAlt — warm tan secondary surface
  text: '#2b1d12',            // ink — warm dark
  textSecondary: '#6b5a48',   // inkSoft — warm secondary
  textTertiary: '#a89880',    // inkFaint — warm tertiary
  textQuaternary: '#a89880',  // inkFaint — same as tertiary for quaternary
  border: 'rgba(43,29,18,0.08)',  // divider
  borderLight: 'rgba(43,29,18,0.05)',
  green: '#5f7d4b',           // good — cozy savings green
  greenLight: '#dce8d4',
  red: '#a8412a',             // bad — cozy error red
  redLight: '#f0d5d0',
  orange: '#c98a2b',          // warn — cozy warning amber
  orangeLight: '#f5e2bf',
  blue: '#3498db',
  purple: '#9b59b6',
  overlay: 'rgba(43,29,18,0.4)',
  tabBar: '#fffaf0',
  tabBarBorder: 'rgba(43,29,18,0.08)',
  statusBar: 'dark-content',
  inputBg: '#fffaf0',
  shimmer1: '#f5ece0',
  shimmer2: '#ede3d5',
  skeleton: '#e8dece',
};

const DARK = {
  primary: '#e8785a',         // lighter terracotta for dark backgrounds
  primaryLight: '#3a1a0e',    // deep terracotta tint
  primaryMuted: '#c4624a',    // muted terracotta
  bg: '#181210',
  card: '#221a15',
  cardAlt: '#1a1208',
  text: '#f5ede4',
  textSecondary: '#c4b0a0',
  textTertiary: '#9a8070',
  textQuaternary: '#7a6050',
  border: 'rgba(245,237,228,0.1)',
  borderLight: 'rgba(245,237,228,0.06)',
  green: '#7a9b66',
  greenLight: '#1a2e10',
  red: '#c45838',
  redLight: '#2b0d08',
  orange: '#d99a4a',
  orangeLight: '#2b1d06',
  blue: '#2980b9',
  purple: '#8e44ad',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#221a15',
  tabBarBorder: 'rgba(245,237,228,0.1)',
  statusBar: 'light-content',
  inputBg: '#221a15',
  shimmer1: '#2a1f18',
  shimmer2: '#302520',
  skeleton: '#2a1f18',
};

/**
 * @deprecated Use `useTheme()` from ThemeContext instead.
 * This is always the light palette regardless of the user's theme preference.
 * Kept for backward-compat with any scripts that import it directly.
 */
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
    shadowColor: '#c64e2e',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  tinted: {
    shadowColor: '#c64e2e',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export function getShadows(isDark) {
  if (isDark) return {
    sm:      { shadowColor: '#000', shadowOpacity: 0.3,  shadowRadius: 5,  elevation: 2 },
    md:      { shadowColor: '#000', shadowOpacity: 0.4,  shadowRadius: 10, elevation: 4 },
    primary: { shadowColor: '#c64e2e', shadowOpacity: 0.4,  shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
    tinted:  { shadowColor: '#c64e2e', shadowOpacity: 0.15, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  };
  return SHADOWS;
}
