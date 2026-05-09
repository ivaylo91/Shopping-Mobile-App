export const CATEGORIES = [
  { id: 'food',      emoji: '🍞', label: 'Хранителни' },
  { id: 'dairy',     emoji: '🥛', label: 'Млечни' },
  { id: 'meat',      emoji: '🥩', label: 'Месо' },
  { id: 'veggies',   emoji: '🥦', label: 'Зеленчуци' },
  { id: 'fruit',     emoji: '🍎', label: 'Плодове' },
  { id: 'drinks',    emoji: '🍹', label: 'Напитки' },
  { id: 'household', emoji: '🧹', label: 'Домакински' },
  { id: 'personal',  emoji: '🧴', label: 'Хигиена' },
  { id: 'other',     emoji: '📦', label: 'Друго' },
];

export const CATEGORY_COLORS = {
  food:      { bg: '#FEF3E2', text: '#92520F', darkBg: '#2A1C08', darkText: '#D4913A' },
  dairy:     { bg: '#E3F4FD', text: '#1B6CA8', darkBg: '#071928', darkText: '#5BA3D4' },
  meat:      { bg: '#FCEAE8', text: '#A83030', darkBg: '#2A0808', darkText: '#D06060' },
  veggies:   { bg: '#E8F5E9', text: '#2E7434', darkBg: '#0A2A0C', darkText: '#5CB860' },
  fruit:     { bg: '#FDE8F0', text: '#9C1A57', darkBg: '#2A0818', darkText: '#D460A0' },
  drinks:    { bg: '#E3EFF8', text: '#1556A0', darkBg: '#08182A', darkText: '#5090D4' },
  household: { bg: '#ECEFF1', text: '#455A64', darkBg: '#161A1C', darkText: '#8EA8B4' },
  personal:  { bg: '#F3E5F5', text: '#6A1B9A', darkBg: '#1A0A2A', darkText: '#B06AD4' },
  other:     { bg: '#F1F1EE', text: '#5A5A54', darkBg: '#1A1A14', darkText: '#9E9E96' },
};

export function getCategoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '📦';
}

export function getCategoryColors(id, isDark) {
  const c = CATEGORY_COLORS[id] ?? CATEGORY_COLORS.other;
  return { bg: isDark ? c.darkBg : c.bg, text: isDark ? c.darkText : c.text };
}

export function guessMappedCategory(category = '') {
  const c = category.toLowerCase();
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) return 'dairy';
  if (c.includes('meat') || c.includes('chicken') || c.includes('beef')) return 'meat';
  if (c.includes('vegetable') || c.includes('veggie')) return 'veggies';
  if (c.includes('fruit') || c.includes('juice')) return 'fruit';
  if (c.includes('beverage') || c.includes('drink') || c.includes('water')) return 'drinks';
  if (c.includes('bread') || c.includes('cereal') || c.includes('pasta')) return 'food';
  return 'other';
}
