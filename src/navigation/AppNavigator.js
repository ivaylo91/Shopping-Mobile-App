import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import StoreComparisonScreen from '../screens/StoreComparisonScreen';
import SharedListScreen, { JoinSharedListScreen } from '../screens/SharedListScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       { focused: 'wallet',   outline: 'wallet-outline' },
  SavedLists: { focused: 'bookmark', outline: 'bookmark-outline' },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#B0B0C3',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ECECF4',
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
    </Tab.Navigator>
  );
}

function AppStack() {
  const Tabs = () => <MainTabs />;
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#6C63FF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        cardStyle: { backgroundColor: '#F7F8FC' },
      }}
    >
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />

      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StoreComparison"
        component={StoreComparisonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SharedList"
        component={SharedListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinSharedList"
        component={JoinSharedListScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
