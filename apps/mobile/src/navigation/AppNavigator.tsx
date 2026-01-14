import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@bmad/shared/stores/authStore';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RecipeLibrary } from '../screens/RecipeLibrary';
import { RecipeDetail } from '../screens/RecipeDetail';
import { RecipeEdit } from '../screens/RecipeEdit';

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
  RecipeLibrary: undefined;
  RecipeDetail: { recipeId: string };
  RecipeEdit: { recipeId: string };
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
    <AppStack.Navigator
      screenOptions={{
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <AppStack.Screen
        name="RecipeLibrary"
        component={RecipeLibrary}
        options={{ title: 'BMad Recette' }}
      />
      <AppStack.Screen
        name="RecipeDetail"
        component={RecipeDetail}
        options={{ title: 'Recipe' }}
      />
      <AppStack.Screen
        name="RecipeEdit"
        component={RecipeEdit}
        options={{ title: 'Edit Recipe' }}
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
