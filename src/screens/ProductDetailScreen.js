import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(product);
    Alert.alert('Added', `${product.name} added to cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>No Image</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price?.toFixed(2)}</Text>

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 280 },
  imagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { color: '#aaa', fontSize: 16 },
  body: { padding: 20 },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  price: { fontSize: 22, color: '#6C63FF', fontWeight: '700', marginBottom: 16 },
  description: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 24 },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
