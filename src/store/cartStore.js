import { create } from 'zustand';

export const useCartStore = create((set) => ({
  cart: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.cart.find((i) => i.id === item.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),

  clearCart: () => set({ cart: [] }),
}));

// Selectors (compute derived values without storing them)
export const selectTotal = (state) =>
  state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const selectItemCount = (state) =>
  state.cart.reduce((sum, i) => sum + i.quantity, 0);
