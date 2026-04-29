import { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const handleAdd = () => {
    addItem(product);
    Alert.alert('Добавено', `${product.name} е добавен в кошницата`, [
      { text: 'Продължи', style: 'cancel' },
      { text: 'Към кошница', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={s.image} />
      ) : (
        <View style={[s.image, s.imagePlaceholder]}>
          <Text style={s.imagePlaceholderText}>Няма снимка</Text>
        </View>
      )}

      <View style={s.inner}>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.price}>{product.price?.toFixed(2)} €</Text>

        {product.description ? (
          <Text style={s.description}>{product.description}</Text>
        ) : null}

        <TouchableOpacity style={s.button} onPress={handleAdd} activeOpacity={0.85} accessibilityLabel="Добави в кошницата" accessibilityRole="button">
          <Text style={s.buttonText}>Добави в кошницата</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    image: { width: '100%', height: isTablet ? 360 : 280 },
    imagePlaceholder: {
      backgroundColor: c.cardAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: { color: c.textTertiary, fontSize: 16 },
    inner: { padding: 20, maxWidth: isTablet ? 720 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' },
    name: { fontSize: isTablet ? 28 : 24, fontWeight: '700', color: c.text, marginBottom: 8 },
    price: { fontSize: isTablet ? 26 : 22, color: c.primary, fontWeight: '700', marginBottom: 16 },
    description: { fontSize: 15, color: c.textSecondary, lineHeight: 22, marginBottom: 24 },
    button: {
      backgroundColor: c.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: c.primary,
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
