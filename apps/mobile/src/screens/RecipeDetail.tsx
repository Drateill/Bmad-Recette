import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { Text, FAB, Portal, IconButton, Button } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import BottomSheet from '@gorhom/bottom-sheet';
import apiClient from '../services/apiClient';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { RecipeIngredients } from '../components/recipes/RecipeIngredients';
import { RecipeSteps } from '../components/recipes/RecipeSteps';
import type { AppStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

/**
 * Recipe Detail Screen
 * Features:
 * - Full-screen photo header
 * - Scrollable content with large readable fonts (18px)
 * - Keep screen awake mode (prevents auto-lock during cooking)
 * - Floating action buttons: Edit, Share, Adjust Portions
 * - Swipe-back gesture (via React Navigation)
 */
export function RecipeDetail() {
  const route = useRoute<RouteProp<AppStackParamList, 'RecipeDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { recipeId } = route.params;
  const { recipe, loading, error, refresh } = useRecipeDetail(recipeId);

  const [fabOpen, setFabOpen] = useState(false);
  const [portionSheetVisible, setPortionSheetVisible] = useState(false);
  const portionSnapPoints = useMemo(() => ['40%'], []);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [portionLoading, setPortionLoading] = useState(false);
  const [portionError, setPortionError] = useState<string | null>(null);
  const [adjustedRecipe, setAdjustedRecipe] = useState<typeof recipe | null>(null);

  // Keep screen awake when viewing recipe
  useEffect(() => {
    activateKeepAwakeAsync();

    return () => {
      deactivateKeepAwake();
    };
  }, []);

  const handleEdit = () => {
    navigation.navigate('RecipeEdit', { recipeId });
    setFabOpen(false);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        title: recipe.title,
        message: `${recipe.title}${recipe.description ? `\n${recipe.description}` : ''}`,
      });
    } catch (shareError) {
      console.error('Share recipe failed:', shareError);
    }
    setFabOpen(false);
  };

  const handleAdjustPortions = () => {
    setPortionError(null);
    setPortionSheetVisible(true);
    setFabOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          {error || 'Recipe not found'}
        </Text>
        <IconButton icon="refresh" size={32} onPress={refresh} />
      </View>
    );
  }

  const displayedRecipe = adjustedRecipe || recipe;
  const primaryPhoto =
    displayedRecipe.photos.find((p) => p.isPrimary) || displayedRecipe.photos[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Full-screen photo header */}
        {primaryPhoto ? (
          <Image
            source={{ uri: primaryPhoto.s3Url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerPlaceholder}>
            <Text variant="displayMedium">🍽️</Text>
          </View>
        )}

        {/* Recipe info */}
        <View style={styles.infoContainer}>
          <Text variant="headlineLarge" style={styles.title}>
            {displayedRecipe.title}
          </Text>

          {displayedRecipe.description && (
            <Text variant="bodyLarge" style={styles.description}>
              {displayedRecipe.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text variant="bodyMedium" style={styles.metaLabel}>
                Prep Time
              </Text>
              <Text variant="titleMedium">{displayedRecipe.prepTime} min</Text>
            </View>

            <View style={styles.metaItem}>
              <Text variant="bodyMedium" style={styles.metaLabel}>
                Cook Time
              </Text>
              <Text variant="titleMedium">{displayedRecipe.cookTime} min</Text>
            </View>

            <View style={styles.metaItem}>
              <Text variant="bodyMedium" style={styles.metaLabel}>
                Total
              </Text>
              <Text variant="titleMedium">{displayedRecipe.totalTime} min</Text>
            </View>
          </View>

          {displayedRecipe.rating && (
            <View style={styles.ratingContainer}>
              <Text variant="titleMedium">
                ⭐ {displayedRecipe.rating.toFixed(1)} / 5
              </Text>
            </View>
          )}

          {displayedRecipe.source && (
            <Text variant="bodyMedium" style={styles.source}>
              Source: {displayedRecipe.source}
            </Text>
          )}
        </View>

        {/* Ingredients */}
        <RecipeIngredients
          ingredients={displayedRecipe.ingredients}
          servings={displayedRecipe.servings}
        />

        {/* Instructions */}
        <RecipeSteps steps={displayedRecipe.steps} />

        {/* Bottom padding for FAB */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'menu'}
          actions={[
            {
              icon: 'pencil',
              label: 'Edit',
              onPress: handleEdit,
            },
            {
              icon: 'share-variant',
              label: 'Share',
              onPress: handleShare,
            },
            {
              icon: 'account-multiple',
              label: 'Adjust Portions',
              onPress: handleAdjustPortions,
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fab}
        />
      </Portal>

      {portionSheetVisible && (
        <BottomSheet
          index={0}
          snapPoints={portionSnapPoints}
          enablePanDownToClose
          onClose={() => setPortionSheetVisible(false)}
        >
          <View style={styles.portionSheet}>
            <Text variant="titleMedium" style={styles.portionTitle}>
              Adjust Portions
            </Text>
            <Text variant="bodyMedium" style={styles.portionText}>
              Multiplier: {portionMultiplier.toFixed(2)}x
            </Text>
            <View style={styles.portionControls}>
              <Button
                mode="outlined"
                onPress={() =>
                  setPortionMultiplier((prev) => Math.max(0.25, prev - 0.25))
                }
              >
                -0.25
              </Button>
              <Button
                mode="outlined"
                onPress={() =>
                  setPortionMultiplier((prev) => Math.min(10, prev + 0.25))
                }
              >
                +0.25
              </Button>
            </View>
            {portionError && (
              <Text variant="bodySmall" style={styles.portionError}>
                {portionError}
              </Text>
            )}
            <View style={styles.portionActions}>
              <Button
                mode="outlined"
                onPress={() => setPortionSheetVisible(false)}
              >
                Close
              </Button>
              <Button
                mode="contained"
                loading={portionLoading}
                onPress={async () => {
                  setPortionLoading(true);
                  setPortionError(null);
                  try {
                    if (portionMultiplier === 1) {
                      setAdjustedRecipe(null);
                    } else {
                      const response = await apiClient.get(
                        `/recipes/${recipeId}/adjust-portions`,
                        { params: { multiplier: portionMultiplier } }
                      );
                      setAdjustedRecipe(response.data);
                    }
                    setPortionSheetVisible(false);
                  } catch (portionErrorResponse: any) {
                    setPortionError(
                      portionErrorResponse.response?.data?.message ||
                        'Failed to adjust portions'
                    );
                  } finally {
                    setPortionLoading(false);
                  }
                }}
              >
                Apply
              </Button>
            </View>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 16,
  },
  headerImage: {
    width,
    height: width * 0.75, // 4:3 aspect ratio
  },
  headerPlaceholder: {
    width,
    height: width * 0.75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  source: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  portionSheet: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    gap: 12,
  },
  portionTitle: {
    fontWeight: '600',
  },
  portionText: {
    color: '#666',
  },
  portionControls: {
    flexDirection: 'row',
    gap: 12,
  },
  portionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  portionError: {
    color: '#c62828',
  },
});
