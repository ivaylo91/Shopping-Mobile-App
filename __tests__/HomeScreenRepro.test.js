import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { AuthContext } from '../src/context/AuthContext';
import { ToastContext } from '../src/context/ToastContext';
import { ThemeContext } from '../src/context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

// Mock dependencies
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 0, Medium: 1 },
  NotificationFeedbackType: { Success: 0 },
}));

jest.mock('../src/hooks/useBudgetLists', () => ({
  useBudgetLists: () => ({ saveList: jest.fn() }),
}));
jest.mock('../src/hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], saveTemplate: jest.fn(), deleteTemplate: jest.fn() }),
}));
jest.mock('../src/hooks/useCustomStores', () => ({
  useCustomStores: () => ({ stores: [], customs: [], addStore: jest.fn(), removeStore: jest.fn() }),
}));
jest.mock('../src/hooks/useRecurringItems', () => ({
  useRecurringItems: () => ({ recurring: [], addRecurring: jest.fn(), removeRecurring: jest.fn(), isRecurring: jest.fn() }),
}));
jest.mock('../src/hooks/usePriceHistory', () => ({
  usePriceHistory: () => ({ getPriceInfo: jest.fn() }),
}));
jest.mock('../src/hooks/useFavoriteStores', () => ({
  useFavoriteStores: () => ({ isFavorite: jest.fn(), toggleFavorite: jest.fn(), sortStores: (s) => s }),
}));
jest.mock('../src/hooks/useLayout', () => ({
  useLayout: () => ({ isTablet: false }),
}));

const mockShowToast = jest.fn();

const AllProviders = ({ children }) => (
  <AuthContext.Provider value={{ logout: jest.fn() }}>
    <ToastContext.Provider value={{ show: mockShowToast }}>
      <ThemeContext.Provider value={{ colors: { primary: '#000', text: '#000', red: '#f00' }, isDark: false, toggleTheme: jest.fn() }}>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeContext.Provider>
    </ToastContext.Provider>
  </AuthContext.Provider>
);

describe('HomeScreen Bug Repro', () => {
  it('should not add item with invalid price (NaN)', async () => {
    const { getByPlaceholderText, getByLabelText, queryByText } = render(
      <AllProviders>
        <HomeScreen navigation={{ setParams: jest.fn() }} route={{ params: {} }} />
      </AllProviders>
    );

    const nameInput = getByPlaceholderText('Продукт');
    const priceInput = getByPlaceholderText('0.00');
    const addBtn = getByLabelText('Добави продукт');

    fireEvent.changeText(nameInput, 'Test Item');
    fireEvent.changeText(priceInput, 'abc'); // This will result in NaN when parsed
    fireEvent.press(addBtn);

    expect(mockShowToast).toHaveBeenCalledWith('Въведете валидна цена', 'warning');
    // It should not be in the list. HomeScreen shows "{count} продукта"
    expect(queryByText('1 продукта')).toBeNull();
  });
});
