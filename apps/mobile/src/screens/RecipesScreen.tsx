import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuthStore } from '@bmad/shared/stores/authStore';

/**
 * Placeholder Recipes Screen
 * This will be implemented in Epic 2
 */
export function RecipesScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Recipes Screen
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Coming in Epic 2
      </Text>
      {user && (
        <Text variant="bodyMedium" style={styles.userName}>
          Welcome, {user.firstName}!
        </Text>
      )}
      <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  userName: {
    marginBottom: 30,
  },
  logoutButton: {
    minWidth: 200,
  },
});
