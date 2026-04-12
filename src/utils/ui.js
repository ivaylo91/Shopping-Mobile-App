// Shared UI constants — imported by ShoppingListScreen, SavedListsScreen, MealsScreen, OrdersScreen

export const CATEGORY_ICONS = {
  meat: '🥩',
  dairy: '🥛',
  vegetables: '🥦',
  fruit: '🍎',
  grains: '🌾',
  snacks: '🍪',
  drinks: '🥤',
  fish: '🐟',
  eggs: '🥚',
  legumes: '🫘',
  bakery: '🍞',
  frozen: '🧊',
  protein: '💪',
  organic: '🌿',
  oils: '🫙',
  canned: '🥫',
};

export function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat?.toLowerCase()] || '🛒';
}

export const GOAL_META = {
  cheapest:     { label: 'Най-евтино',        icon: '💰', color: '#f39c12' },
  healthy:      { label: 'Здравословно',      icon: '🥗', color: '#2ecc71' },
  high_protein: { label: 'Богато на протеин', icon: '💪', color: '#e74c3c' },
};
