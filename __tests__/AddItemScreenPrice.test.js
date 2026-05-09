import { render, fireEvent } from '@testing-library/react-native';
import AddItemScreen from '../src/screens/AddItemScreen';
import { ToastContext } from '../src/context/ToastContext';
import { ThemeContext } from '../src/context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}), { virtual: true });
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 1 },
}));

const mockShowToast = jest.fn();
const mockNavigation = {
  goBack: jest.fn(),
  setParams: jest.fn(),
  navigate: jest.fn(),
};

const AllProviders = ({ children }) => (
  <ToastContext.Provider value={{ show: mockShowToast }}>
    <ThemeContext.Provider value={{ colors: { primary: '#000', text: '#000', surface: '#fff', border: '#ccc' }, isDark: false }}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </ThemeContext.Provider>
  </ToastContext.Provider>
);

describe('AddItemScreen - Price Comma Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle comma as decimal separator in price', () => {
    const { getByPlaceholderText, getByText } = render(
      <AllProviders>
        <AddItemScreen navigation={mockNavigation} route={{ params: {} }} />
      </AllProviders>
    );

    const nameInput = getByPlaceholderText('напр. Прясно мляко');
    const priceInput = getByPlaceholderText('0.00');
    const addBtn = getByText('Добави в списъка');

    fireEvent.changeText(nameInput, 'Test Item');
    fireEvent.changeText(priceInput, '5,50');
    fireEvent.press(addBtn);

    // It should NOT show an error toast
    expect(mockShowToast).not.toHaveBeenCalledWith('Въведете валидна цена', 'warning');
    
    // It should navigate back with the item
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainTabs', expect.objectContaining({
      screen: 'Home',
      params: expect.objectContaining({
        addedItem: expect.objectContaining({
          name: 'Test Item',
          price: 5.5
        })
      })
    }));
  });

  it('should show error for invalid non-numeric price', () => {
    const { getByPlaceholderText, getByText } = render(
      <AllProviders>
        <AddItemScreen navigation={mockNavigation} route={{ params: {} }} />
      </AllProviders>
    );

    const nameInput = getByPlaceholderText('напр. Прясно мляко');
    const priceInput = getByPlaceholderText('0.00');
    const addBtn = getByText('Добави в списъка');

    fireEvent.changeText(nameInput, 'Test Item');
    fireEvent.changeText(priceInput, 'abc');
    fireEvent.press(addBtn);

    expect(mockShowToast).toHaveBeenCalledWith('Въведете валидна цена', 'warning');
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
