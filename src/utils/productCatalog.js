import { KAUFLAND_PRODUCTS } from './kauflandProducts';
import { BILLA_PRODUCTS } from './billaProducts';

export const PRODUCT_CATALOG = [
  ...KAUFLAND_PRODUCTS.map((p) => ({ ...p, store: 'Kaufland' })),
  ...BILLA_PRODUCTS,
];
