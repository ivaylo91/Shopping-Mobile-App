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

export default function Text({ style, maxFontSizeMultiplier = 1.4, ...props }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const family = WEIGHT_FAMILY[flat.fontWeight ?? '400'] ?? 'Figtree_400Regular';
  return <RNText style={[{ fontFamily: family }, style]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}
