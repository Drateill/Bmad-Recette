import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@bmad/shared/stores/authStore';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RecipesScreen } from '../screens/RecipesScreen';

/**
 * Auth Stack Parameter List
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/**
 * App Stack Parameter List
 */
export type AppStackParamList = {
  Recipes: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

/**
 * Auth Navigator - Login and Register screens
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * App Navigator - Authenticated screens
 */
function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{ title: 'BMad Recette' }}
      />
    </AppStack.Navigator>
  );
}

/**
 * Root Navigator - Conditional rendering based on auth state
 */
export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
