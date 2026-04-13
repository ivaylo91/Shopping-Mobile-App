import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

const CartItem = ({ item, onRemove, onIncrease, onDecrease }) => (
  <View style={styles.item}>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.itemUnitPrice}>{item.price.toFixed(2)} €/бр.</Text>
    </View>
    <View style={styles.itemControls}>
      <TouchableOpacity
        style={styles.qtyBtn}
        onPress={onDecrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="remove" size={16} color="#6C63FF" />
      </TouchableOpacity>
      <Text style={styles.qty}>{item.quantity}</Text>
      <TouchableOpacity
        style={styles.qtyBtn}
        onPress={onIncrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add" size={16} color="#6C63FF" />
      </TouchableOpacity>
      <Text style={styles.itemSubtotal}>{(item.price * item.quantity).toFixed(2)} €</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function CartScreen({ navigation }) {
  const { cart, total, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { show: showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleIncrease = useCallback((item) => {
    Haptics.selectionAsync();
    updateQuantity(item.id, item.quantity + 1);
  }, [updateQuantity]);

  const handleDecrease = useCallback((item) => {
    Haptics.selectionAsync();
    if (item.quantity === 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  }, [removeItem, updateQuantity]);

  const handleRemove = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeItem(item.id);
  }, [removeItem]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Потвърди поръчка',
      `Общо: ${total.toFixed(2)} €\n${itemCount} продукта`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Поръчай',
          onPress: async () => {
            setLoading(true);
            try {
              await placeOrder(cart, total);
              clearCart();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Поръчката е направена успешно!', 'success');
              navigation.navigate('Orders');
            } catch (err) {
              showToast(err.message || 'Неуспешна поръчка', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = useCallback(({ item }) => (
    <CartItem
      item={item}
      onIncrease={() => handleIncrease(item)}
      onDecrease={() => handleDecrease(item)}
      onRemove={() => handleRemove(item)}
    />
  ), [handleIncrease, handleDecrease, handleRemove]);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#E0E0EA" />
        <Text style={styles.emptyTitle}>Кошницата е празна</Text>
        <Text style={styles.emptyDesc}>
          Добавете продукти от списъка за пазаруване
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyBtnText}>Към начало</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Кошница</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Изчисти кошницата', 'Сигурни ли сте?', [
              { text: 'Отказ', style: 'cancel' },
              { text: 'Изчисти', style: 'destructive', onPress: () => { clearCart(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
            ]);
          }}
        >
          <Text style={styles.clearText}>Изчисти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>{itemCount} продукта</Text>
          <Text style={styles.footerTotal}>{total.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.checkoutText}>Поръчай</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F7F8FC',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  clearText: { fontSize: 14, color: '#e74c3c', fontWeight: '600' },

  list: { padding: 14, paddingBottom: 8 },

  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemInfo: { marginBottom: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  itemUnitPrice: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qty: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', minWidth: 22, textAlign: 'center' },
  itemSubtotal: { flex: 1, fontSize: 15, fontWeight: '800', color: '#6C63FF', textAlign: 'right' },

  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { fontSize: 12, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  footerTotal: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  checkoutBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
