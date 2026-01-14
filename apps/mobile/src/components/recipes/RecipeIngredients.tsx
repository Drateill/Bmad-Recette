import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import type { RecipeIngredient } from '@bmad/shared/types/recipe.types';

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[];
  servings: number;
}

/**
 * Recipe Ingredients Component
 * Large readable font (18px) for cooking readability
 */
export function RecipeIngredients({ ingredients, servings }: RecipeIngredientsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Ingredients
        </Text>
        <Text variant="bodyMedium" style={styles.servings}>
          {servings} servings
        </Text>
      </View>

      <Divider style={styles.divider} />

      {ingredients.map((ingredient) => (
        <View key={ingredient.id} style={styles.ingredientRow}>
          <Text variant="bodyLarge" style={styles.ingredientText}>
            • {ingredient.quantity} {ingredient.unit} {ingredient.ingredientName}
            {ingredient.notes && (
              <Text style={styles.notes}> ({ingredient.notes})</Text>
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
  },
  servings: {
    color: '#666',
  },
  divider: {
    marginBottom: 12,
  },
  ingredientRow: {
    paddingVertical: 8,
  },
  ingredientText: {
    fontSize: 18,
    lineHeight: 28,
  },
  notes: {
    fontStyle: 'italic',
    color: '#666',
  },
});
