/**
 * CartContext — thin compatibility shim over the Zustand cart store.
 *
 * All components still import `useCart` from here — nothing else changes.
 * The CartProvider is kept so App.js doesn't need to be touched for this layer,
 * but it's now a no-op wrapper (Zustand needs no Provider).
 */
import { useCartStore, selectTotal, selectItemCount } from '../store/cartStore';

// No-op provider — Zustand is global, no context tree needed.
export function CartProvider({ children }) {
  return children;
}

// Drop-in replacement for the old useCart() hook.
export function useCart() {
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore(selectTotal);
  const itemCount = useCartStore(selectItemCount);

  return { cart, total, itemCount, addItem, removeItem, updateQuantity, clearCart };
}
