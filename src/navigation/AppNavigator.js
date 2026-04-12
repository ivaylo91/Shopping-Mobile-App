import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import MealsScreen from '../screens/MealsScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import OrdersScreen from '../screens/OrdersScreen';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#6C63FF',
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: '#F7F8FC' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: 'Your List' }}
      />
      <Stack.Screen
        name="Meals"
        component={MealsScreen}
        options={{ title: 'Идеи за ястия' }}
      />
      <Stack.Screen
        name="SavedLists"
        component={SavedListsScreen}
        options={{ title: 'Запазени списъци' }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Моите поръчки' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // DEV: set to true to always show login screen (e.g. for UI testing)
  const __DEV_SHOW_AUTH__ = false;

  return (
    <NavigationContainer>
      {!__DEV_SHOW_AUTH__ && user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
