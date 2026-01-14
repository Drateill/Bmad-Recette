import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/AppNavigator';
import { initializeAuth, useAuthRestore } from './src/hooks/useAuth';

export default function App() {
  // Initialize auth implementations on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  // Restore auth state from secure storage
  useAuthRestore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
