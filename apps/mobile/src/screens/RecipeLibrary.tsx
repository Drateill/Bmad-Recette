import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Searchbar, IconButton, Text, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { FilterBottomSheet } from '../components/filters/FilterBottomSheet';
import { useRecipes } from '../hooks/useRecipes';
import type { RecipeListItem, RecipeFilterOptions } from '@bmad/shared/types/recipe.types';
import type { AppStackParamList } from '../navigation/AppNavigator';

/**
 * Recipe Library Screen
 * Features:
 * - Vertical scrollable list with FlatList (performance optimized)
 * - Pull-to-refresh gesture
 * - Search bar with filter button
 * - Infinite scroll pagination
 */
export function RecipeLibrary() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {
    recipes,
    loading,
    error,
    refreshing,
    hasMore,
    fetchRecipes,
    refresh,
    loadMore,
  } = useRecipes();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<RecipeFilterOptions>({});

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchRecipes({ ...activeFilters, searchQuery: query });
  };

  const handleFilterApply = (filters: RecipeFilterOptions) => {
    setActiveFilters(filters);
    fetchRecipes({ ...filters, searchQuery });
    setFilterSheetVisible(false);
  };

  const handleFilterClear = () => {
    setActiveFilters({});
    fetchRecipes({ searchQuery });
    setFilterSheetVisible(false);
  };

  const handleRecipePress = (recipeId: string) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const handleCreateRecipe = () => {
    // Navigate to create recipe screen (to be implemented)
    console.log('Create new recipe');
  };

  const renderRecipeCard = ({ item }: { item: RecipeListItem }) => (
    <RecipeCard recipe={item} onPress={handleRecipePress} />
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No recipes found
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          {searchQuery || Object.keys(activeFilters).length > 0
            ? 'Try adjusting your filters'
            : 'Start by creating your first recipe'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search recipes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => setFilterSheetVisible(true)}
          style={styles.filterButton}
          testID="filter-button"
        />
      </View>

      {renderError()}

      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        testID="recipe-list"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateRecipe}
        label="New Recipe"
      />

      <FilterBottomSheet
        visible={filterSheetVisible}
        onDismiss={() => setFilterSheetVisible(false)}
        onApply={handleFilterApply}
        onClear={handleFilterClear}
        initialFilters={activeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flex: 1,
    elevation: 0,
  },
  filterButton: {
    margin: 0,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
