import { render, fireEvent } from '@testing-library/react-native';
import AddItemScreen from '../src/screens/AddItemScreen';
import { ToastContext } from '../src/context/ToastContext';
import { ThemeContext } from '../src/context/ThemeContext';
import React from 'react';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 1 },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}), { virtual: true });

jest.mock('../src/hooks/useLayout', () => ({
  useLayout: () => ({ isTablet: false }),
}));

const mockShowToast = jest.fn();
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const AllProviders = ({ children }) => (
  <ToastContext.Provider value={{ show: mockShowToast }}>
    <ThemeContext.Provider value={{ colors: { bg: '#fff', card: '#eee', cardAlt: '#ddd', text: '#000', textTertiary: '#666', primary: '#007AFF', primaryLight: '#E3F2FD' }, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  </ToastContext.Provider>
);

describe('AddItemScreen', () => {
  it('renders correctly and allows adding an item', () => {
    const { getByPlaceholderText, getByLabelText, getByText } = render(
      <AllProviders>
        <AddItemScreen navigation={mockNavigation} route={{ params: {} }} />
      </AllProviders>
    );

    // Verify it rendered without crashing
    expect(getByText('Добавяне на продукт')).toBeTruthy();

    const nameInput = getByPlaceholderText('напр. Прясно мляко');
    const priceInput = getByPlaceholderText('0.00');
    const addBtn = getByLabelText('Добави продукта в списъка');

    fireEvent.changeText(nameInput, 'Milk');
    fireEvent.changeText(priceInput, '1.50');
    fireEvent.press(addBtn);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainTabs', {
      screen: 'Home',
      params: {
        addedItem: expect.objectContaining({
          name: 'Milk',
          price: 1.5,
          quantity: 1,
          category: 'other'
        })
      },
    });
  });

  it('shows error if name is missing', () => {
    const { getByLabelText } = render(
      <AllProviders>
        <AddItemScreen navigation={mockNavigation} route={{ params: {} }} />
      </AllProviders>
    );

    const addBtn = getByLabelText('Добави продукта в списъка');
    fireEvent.press(addBtn);

    expect(mockShowToast).toHaveBeenCalledWith('Въведете наименование', 'warning');
  });
});
