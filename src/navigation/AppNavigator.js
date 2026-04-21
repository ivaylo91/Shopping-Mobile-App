import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import StoreComparisonScreen from '../screens/StoreComparisonScreen';
import SharedListScreen, { JoinSharedListScreen } from '../screens/SharedListScreen';
import MealsScreen from '../screens/MealsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       { focused: 'wallet',       outline: 'wallet-outline' },
  SavedLists: { focused: 'bookmark',     outline: 'bookmark-outline' },
  Meals:      { focused: 'restaurant',   outline: 'restaurant-outline' },
  Shared:     { focused: 'people',       outline: 'people-outline' },
};

function AuthStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.card } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.textTertiary : '#B0B0C3',
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.outline} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Нов списък' }} />
      <Tab.Screen name="SavedLists" component={SavedListsScreen} options={{ tabBarLabel: 'Запазени' }} />
      <Tab.Screen name="Meals" component={MealsScreen} options={{ tabBarLabel: 'Ястия' }} />
      <Tab.Screen name="Shared" component={SharedListScreen} options={{ tabBarLabel: 'Споделен' }} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { colors, isDark } = useTheme();
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
      <Stack.Screen name="StoreComparison" component={StoreComparisonScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SharedList" component={SharedListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JoinSharedList" component={JoinSharedListScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

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
