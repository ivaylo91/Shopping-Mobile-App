import { KAUFLAND_PRODUCTS } from './kauflandProducts';
import { KAUFLAND_IMPORTED_PRODUCTS } from './kauflandImported';
import { METRO_IMPORTED_PRODUCTS } from './metroImported';
import { FANTASTICO_IMPORTED_PRODUCTS } from './fantasticoImported';
import { LIDL_IMPORTED_PRODUCTS } from './lidlImported';
import { BILLA_PRODUCTS } from './billaProducts';

export const PRODUCT_CATALOG = [
  ...KAUFLAND_PRODUCTS.map((p) => ({ ...p, store: 'Kaufland' })),
  ...KAUFLAND_IMPORTED_PRODUCTS.map((p) => ({ ...p, store: 'Kaufland' })),
  ...METRO_IMPORTED_PRODUCTS.map((p) => ({ ...p, store: 'Metro' })),
  ...FANTASTICO_IMPORTED_PRODUCTS.map((p) => ({ ...p, store: 'Fantastico' })),
  ...LIDL_IMPORTED_PRODUCTS.map((p) => ({ ...p, store: 'Lidl' })),
  ...BILLA_PRODUCTS,
];
