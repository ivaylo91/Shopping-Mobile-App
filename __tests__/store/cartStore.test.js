import { useCartStore, selectTotal, selectItemCount } from '../../src/store/cartStore';

const ITEM_A = { id: 'a', name: 'Milk',    price: 1.50 };
const ITEM_B = { id: 'b', name: 'Chicken', price: 5.00 };

beforeEach(() => {
  useCartStore.setState({ cart: [] });
});

describe('addItem', () => {
  it('adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(ITEM_A);
    const { cart } = useCartStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ id: 'a', quantity: 1 });
  });

  it('increments quantity when the same item is added again', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_A);
    const { cart } = useCartStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('keeps separate entries for different items', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    expect(useCartStore.getState().cart).toHaveLength(2);
  });
});

describe('removeItem', () => {
  it('removes the item by id', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    useCartStore.getState().removeItem('a');
    const { cart } = useCartStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('b');
  });

  it('is a no-op when id does not exist', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().removeItem('zzz');
    expect(useCartStore.getState().cart).toHaveLength(1);
  });
});

describe('updateQuantity', () => {
  it('sets the quantity for an existing item', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().updateQuantity('a', 5);
    expect(useCartStore.getState().cart[0].quantity).toBe(5);
  });

  it('does not affect other items', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    useCartStore.getState().updateQuantity('a', 3);
    const b = useCartStore.getState().cart.find((i) => i.id === 'b');
    expect(b.quantity).toBe(1);
  });
});

describe('clearCart', () => {
  it('empties the cart', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().cart).toHaveLength(0);
  });
});

describe('selectTotal', () => {
  it('sums price × quantity for all items', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_A); // qty = 2
    useCartStore.getState().addItem(ITEM_B); // qty = 1
    const total = selectTotal(useCartStore.getState());
    expect(total).toBeCloseTo(1.5 * 2 + 5.0 * 1);
  });

  it('returns 0 for an empty cart', () => {
    expect(selectTotal(useCartStore.getState())).toBe(0);
  });
});

describe('selectItemCount', () => {
  it('sums all quantities', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_A); // qty = 2
    useCartStore.getState().addItem(ITEM_B); // qty = 1
    expect(selectItemCount(useCartStore.getState())).toBe(3);
  });

  it('returns 0 for an empty cart', () => {
    expect(selectItemCount(useCartStore.getState())).toBe(0);
  });
});
