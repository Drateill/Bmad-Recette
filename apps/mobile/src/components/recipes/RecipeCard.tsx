import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import type { RecipeListItem } from '@bmad/shared/types/recipe.types';

interface RecipeCardProps {
  recipe: RecipeListItem;
  onPress: (recipeId: string) => void;
}

/**
 * Mobile-optimized recipe card component
 * Features:
 * - Horizontal layout (photo left, info right)
 * - Large touch targets (min 44x44px)
 * - Recipe info: title, time, rating, tags
 */
export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const handlePress = () => {
    onPress(recipe.id);
  };

  const renderRating = () => {
    if (!recipe.rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Text variant="bodySmall">⭐ {recipe.rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {recipe.primaryPhoto ? (
          <Image
            source={{ uri: recipe.primaryPhoto.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text variant="bodyLarge">🍽️</Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
          {recipe.title}
        </Text>

        {recipe.description && (
          <Text variant="bodySmall" numberOfLines={1} style={styles.description}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.metaContainer}>
          <Text variant="bodySmall" style={styles.time}>
            ⏱️ {recipe.totalTime} min
          </Text>
          {renderRating()}
          <Text variant="bodySmall" style={styles.servings}>
            👥 {recipe.servings}
          </Text>
        </View>

        {recipe.tagIds && recipe.tagIds.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tagIds.slice(0, 3).map((tagId) => (
              <Chip key={tagId} compact style={styles.tag}>
                {tagId}
              </Chip>
            ))}
            {recipe.tagIds.length > 3 && (
              <Text variant="bodySmall" style={styles.moreTags}>
                +{recipe.tagIds.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  time: {
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servings: {
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    height: 24,
    backgroundColor: '#e3f2fd',
  },
  moreTags: {
    color: '#666',
    marginLeft: 4,
  },
});
