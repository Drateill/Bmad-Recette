import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/AppNavigator';

/**
 * Placeholder Recipe Edit Screen
 * Full edit experience will be implemented in a follow-up story.
 */
export function RecipeEdit() {
  const route = useRoute<RouteProp<AppStackParamList, 'RecipeEdit'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { recipeId } = route.params;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Edit Recipe
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Editing for recipe {recipeId} will be available soon.
      </Text>
      <Button mode="outlined" onPress={() => navigation.goBack()}>
        Back to Recipe
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
});
