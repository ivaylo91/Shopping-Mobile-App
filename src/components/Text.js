import { Text as RNText, StyleSheet } from 'react-native';

const WEIGHT_FAMILY = {
  '300': 'Figtree_300Light',
  '400': 'Figtree_400Regular',
  normal: 'Figtree_400Regular',
  '500': 'Figtree_500Medium',
  '600': 'Figtree_600SemiBold',
  '700': 'Figtree_700Bold',
  bold: 'Figtree_700Bold',
  '800': 'Figtree_800ExtraBold',
  '900': 'Figtree_900Black',
};

// Typescale presets — applied before the explicit style prop so callers can override
const VARIANTS = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  title:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  body:    { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
  label:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
};

export default function Text({ style, variant, maxFontSizeMultiplier = 1.4, ...props }) {
  const variantStyle = variant ? VARIANTS[variant] : null;
  const flat = StyleSheet.flatten([variantStyle, style]) ?? {};
  const family = WEIGHT_FAMILY[flat.fontWeight ?? '400'] ?? 'Figtree_400Regular';
  return (
    <RNText
      style={[{ fontFamily: family }, variantStyle, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  );
}
