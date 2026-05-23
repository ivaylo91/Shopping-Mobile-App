import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, ActivityIndicator, View, Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../hooks/useLayout';
import { requestNotificationPermission } from '../services/geoNotifications';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import SpendingInsightsScreen from '../screens/SpendingInsightsScreen';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import StorePickerScreen from '../screens/StorePickerScreen';
import AddItemScreen from '../screens/AddItemScreen';
import MealsScreen from '../screens/MealsScreen';

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

  // CozyTabBar: floating pill that sits above content
  const tabBottom = phoneLandscape ? 10 : Platform.OS === 'ios' ? 22 : 14;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderRadius: 999,
          marginHorizontal: 20,
          bottom: tabBottom,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#2B1D12',
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        },
        tabBarItemStyle: { borderRadius: 999 },
        tabBarActiveBackgroundColor: colors.primary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.outline} size={22} color={color} />;
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
      <Stack.Screen name="Meals" component={MealsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
