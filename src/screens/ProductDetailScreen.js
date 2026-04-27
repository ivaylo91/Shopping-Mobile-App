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

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

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

      <View style={s.body}>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.price}>{product.price?.toFixed(2)} €</Text>

        {product.description ? (
          <Text style={s.description}>{product.description}</Text>
        ) : null}

        <TouchableOpacity style={s.button} onPress={handleAdd} activeOpacity={0.85}>
          <Text style={s.buttonText}>Добави в кошницата</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    image: { width: '100%', height: 280 },
    imagePlaceholder: {
      backgroundColor: c.cardAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: { color: c.textTertiary, fontSize: 16 },
    body: { padding: 20 },
    name: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 8 },
    price: { fontSize: 22, color: c.primary, fontWeight: '700', marginBottom: 16 },
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
