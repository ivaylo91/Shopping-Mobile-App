jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}), { virtual: true });
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-haptics', () => ({}));
jest.mock('react-native-safe-area-context', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

import { guessMappedCategory } from '../../src/constants/categories';

describe('guessMappedCategory', () => {
  it('should guess dairy correctly', () => {
    expect(guessMappedCategory('Milk')).toBe('dairy');
    expect(guessMappedCategory('Cheese')).toBe('dairy');
    expect(guessMappedCategory('Greek Yogurt')).toBe('other'); // yogurt not in dairy keywords but milk is
    expect(guessMappedCategory('Whole milk')).toBe('dairy');
  });

  it('should guess meat correctly', () => {
    expect(guessMappedCategory('Beef steak')).toBe('meat');
    expect(guessMappedCategory('Chicken wings')).toBe('meat');
    expect(guessMappedCategory('Pork meat')).toBe('meat');
  });

  it('should guess veggies correctly', () => {
    expect(guessMappedCategory('Tomato vegetable')).toBe('veggies');
    expect(guessMappedCategory('Veggie mix')).toBe('veggies');
  });

  it('should guess fruit correctly', () => {
    expect(guessMappedCategory('Apple fruit')).toBe('fruit');
    expect(guessMappedCategory('Orange juice')).toBe('fruit');
  });

  it('should guess drinks correctly', () => {
    expect(guessMappedCategory('Cold beverage')).toBe('drinks');
    expect(guessMappedCategory('Energy drink')).toBe('drinks');
    expect(guessMappedCategory('Mineral water')).toBe('drinks');
  });

  it('should guess food (bakery/pasta) correctly', () => {
    expect(guessMappedCategory('Whole wheat bread')).toBe('food');
    expect(guessMappedCategory('Corn cereal')).toBe('food');
    expect(guessMappedCategory('Penne pasta')).toBe('food');
  });

  it('should return other for unknown categories', () => {
    expect(guessMappedCategory('Toilet paper')).toBe('other');
    expect(guessMappedCategory('')).toBe('other');
    expect(guessMappedCategory(undefined)).toBe('other');
  });
});
