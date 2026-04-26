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
  primary: '#2B7A5C',         // warm forest green — grounded, nourishing, calm
  primaryLight: '#EAF5EF',    // light mint tint
  primaryMuted: '#78B096',    // muted green for secondary elements
  bg: '#F5F7F5',              // subtly green-tinted (cohesion with primary hue)
  card: '#FFFFFF',
  cardAlt: '#EFF4F0',         // subtle green tint (was #F7F8FC)
  text: '#1A1A2E',
  textSecondary: '#555566',
  textTertiary: '#6D6D6D',    // WCAG AA fixed: ~5.5:1 on white (was #999 at 2.6:1)
  textQuaternary: '#767676',  // WCAG AA fixed: ~4.54:1 on white (was #bbb at 1.8:1)
  border: '#DDE4DE',          // green-tinted border
  borderLight: '#EBF0EC',     // green-tinted divider
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
  tabBarBorder: '#DDE4DE',
  statusBar: 'dark-content',
  inputBg: '#FFFFFF',
  shimmer1: '#EDF2EE',
  shimmer2: '#E5EDE7',
  skeleton: '#DDE7DF',
};

const DARK = {
  primary: '#4DB88A',         // lighter forest green for dark backgrounds
  primaryLight: '#0B2419',    // deep green tint
  primaryMuted: '#3A8A68',    // muted green
  bg: '#0F0F18',
  card: '#1A1E1B',            // subtle green-warm dark card
  cardAlt: '#131812',         // slight green dark
  text: '#F0F2F0',            // warm white (slight green tint)
  textSecondary: '#B0B4B0',   // green-neutral secondary
  textTertiary: '#9A9A9A',    // WCAG AA fixed: ~6.2:1 on dark card (was #7775A8 at 3.9:1)
  textQuaternary: '#888888',  // WCAG AA fixed: ~4.9:1 on dark card (was #555380, near-invisible)
  border: '#263028',          // dark green-tinted border
  borderLight: '#1C2520',
  green: '#27ae60',
  greenLight: '#0D2B1A',
  red: '#c0392b',
  redLight: '#2B0D0D',
  orange: '#d68910',
  orangeLight: '#2B1D06',
  blue: '#2980b9',
  purple: '#8e44ad',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#1A1E1B',
  tabBarBorder: '#263028',
  statusBar: 'light-content',
  inputBg: '#1A1E1B',
  shimmer1: '#20261F',
  shimmer2: '#252E24',
  skeleton: '#263028',
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
    shadowColor: '#2B7A5C',   // matches new forest-green primary
    shadowOpacity: 0.28,      // reduced from 0.35 — less "glow", more grounded
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
};

export function getShadows(isDark) {
  if (isDark) return {
    sm:      { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
    md:      { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
    primary: { shadowColor: '#4DB88A', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  };
  return SHADOWS;
}
