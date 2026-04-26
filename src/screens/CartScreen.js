import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const CartItem = ({ item, onRemove, onIncrease, onDecrease, s, colors }) => (
  <View style={s.item}>
    <View style={s.itemInfo}>
      <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
      <Text style={s.itemUnitPrice}>{item.price.toFixed(2)} €/бр.</Text>
    </View>
    <View style={s.itemControls}>
      <TouchableOpacity
        style={s.qtyBtn}
        onPress={onDecrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="remove" size={16} color={colors.primary} />
      </TouchableOpacity>
      <Text style={s.qty}>{item.quantity}</Text>
      <TouchableOpacity
        style={s.qtyBtn}
        onPress={onIncrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
      </TouchableOpacity>
      <Text style={s.itemSubtotal}>{(item.price * item.quantity).toFixed(2)} €</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.red} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function CartScreen({ navigation }) {
  const { cart, total, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { show: showToast } = useToast();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

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
      s={s}
      colors={colors}
      onIncrease={() => handleIncrease(item)}
      onDecrease={() => handleDecrease(item)}
      onRemove={() => handleRemove(item)}
    />
  ), [s, colors, handleIncrease, handleDecrease, handleRemove]);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={s.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.border} />
        <Text style={s.emptyTitle}>Кошницата е празна</Text>
        <Text style={s.emptyDesc}>
          Добавете продукти от списъка за пазаруване
        </Text>
        <TouchableOpacity
          style={s.emptyBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={s.emptyBtnText}>Към начало</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Кошница</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Изчисти кошницата', 'Сигурни ли сте?', [
              { text: 'Отказ', style: 'cancel' },
              { text: 'Изчисти', style: 'destructive', onPress: () => { clearCart(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
            ]);
          }}
        >
          <Text style={s.clearText}>Изчисти</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={90}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.footerLabel}>{itemCount} продукта</Text>
          <Text style={s.footerTotal}>{total.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity
          style={[s.checkoutBtn, loading && s.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={s.checkoutText}>Поръчай</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: c.bg,
    },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 16, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    emptyBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingHorizontal: 28,
      paddingVertical: 14,
      shadowColor: c.primary,
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    header: {
      backgroundColor: c.card,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: c.text },
    clearText: { fontSize: 14, color: c.red, fontWeight: '600' },

    list: { padding: 14, paddingBottom: 8 },

    item: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    itemInfo: { marginBottom: 10 },
    itemName: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 3 },
    itemUnitPrice: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },
    itemControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qty: { fontSize: 16, fontWeight: '700', color: c.text, minWidth: 22, textAlign: 'center' },
    itemSubtotal: { flex: 1, fontSize: 15, fontWeight: '800', color: c.primary, textAlign: 'right' },

    footer: {
      backgroundColor: c.card,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerLabel: { fontSize: 12, color: c.textTertiary, fontWeight: '600', marginBottom: 2 },
    footerTotal: { fontSize: 22, fontWeight: '800', color: c.text },
    checkoutBtn: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: c.primary,
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    checkoutBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
    checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
