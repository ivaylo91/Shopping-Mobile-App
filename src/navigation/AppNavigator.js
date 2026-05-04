import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';

import HomeScreen from '../screens/HomeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import SpendingInsightsScreen from '../screens/SpendingInsightsScreen';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import StorePickerScreen from '../screens/StorePickerScreen';
import AddItemScreen from '../screens/AddItemScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       { focused: 'wallet',     outline: 'wallet-outline' },
  SavedLists: { focused: 'time',       outline: 'time-outline' },
  Insights:   { focused: 'bar-chart',  outline: 'bar-chart-outline' },
};

function MainTabs() {
  const { colors } = useTheme();
  const { isLandscape, isTablet } = useLayout();
  const phoneLandscape = isLandscape && !isTablet;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textQuaternary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: phoneLandscape ? 52 : 70,
          paddingBottom: phoneLandscape ? 6 : 10,
          paddingTop: phoneLandscape ? 5 : 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.outline} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Нов списък' }} />
      <Tab.Screen name="SavedLists" component={SavedListsScreen} options={{ tabBarLabel: 'История' }} />
      <Tab.Screen name="Insights" component={SpendingInsightsScreen} options={{ tabBarLabel: 'Статистики' }} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const Tabs = () => <MainTabs />;
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        cardStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StorePicker" component={StorePickerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddItemScreen" component={AddItemScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <AppStack />
    </NavigationContainer>
  );
}
