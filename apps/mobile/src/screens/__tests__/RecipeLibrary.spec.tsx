import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { RecipeLibrary } from '../RecipeLibrary';
import { useRecipes } from '../../hooks/useRecipes';
import { useTagCategories } from '../../hooks/useTagCategories';

jest.mock('../../hooks/useRecipes');
jest.mock('../../hooks/useTagCategories');
jest.mock('../../components/filters/FilterBottomSheet', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return {
    FilterBottomSheet: ({
      visible,
      onApply,
      onClear,
    }: {
      visible: boolean;
      onApply: (filters: unknown) => void;
      onClear: () => void;
    }) =>
      visible ? (
        <View>
          <Text>Filters</Text>
          <Pressable onPress={() => onApply({})}>
            <Text>Apply Filters</Text>
          </Pressable>
          <Pressable onPress={onClear}>
            <Text>Clear All</Text>
          </Pressable>
        </View>
      ) : null,
  };
});
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

const mockUseRecipes = useRecipes as jest.Mock;
const mockUseTagCategories = useTagCategories as jest.Mock;
let refreshMock: jest.Mock;
let fetchRecipesMock: jest.Mock;

describe('RecipeLibrary', () => {
  beforeEach(() => {
    refreshMock = jest.fn();
    fetchRecipesMock = jest.fn();
    mockUseRecipes.mockReturnValue({
      recipes: [
        {
          id: 'recipe-1',
          title: 'Pasta Primavera',
          description: null,
          prepTime: 10,
          cookTime: 20,
          totalTime: 30,
          servings: 2,
          rating: 4.5,
          primaryPhoto: null,
          tagIds: [],
        },
      ],
      loading: false,
      error: null,
      refreshing: false,
      hasMore: false,
      page: 1,
      fetchRecipes: fetchRecipesMock,
      refresh: refreshMock,
      loadMore: jest.fn(),
    });

    mockUseTagCategories.mockReturnValue({
      categories: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('renders recipe list items', () => {
    const { getByText } = render(
      <PaperProvider>
        <RecipeLibrary />
      </PaperProvider>
    );
    expect(getByText('Pasta Primavera')).toBeTruthy();
  });

  it('triggers pull-to-refresh', () => {
    const { getByTestId } = render(
      <PaperProvider>
        <RecipeLibrary />
      </PaperProvider>
    );
    const list = getByTestId('recipe-list');
    list.props.refreshControl.props.onRefresh();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('opens filter bottom sheet', () => {
    const { getByTestId, getByText } = render(
      <PaperProvider>
        <RecipeLibrary />
      </PaperProvider>
    );
    fireEvent.press(getByTestId('filter-button'));
    expect(getByText('Filters')).toBeTruthy();
  });

  it('applies and clears filters', async () => {
    const { getByTestId, findByText } = render(
      <PaperProvider>
        <RecipeLibrary />
      </PaperProvider>
    );

    fireEvent.press(getByTestId('filter-button'));
    fireEvent.press(await findByText('Apply Filters'));
    expect(fetchRecipesMock).toHaveBeenCalled();

    fireEvent.press(getByTestId('filter-button'));
    fireEvent.press(await findByText('Clear All'));
    expect(fetchRecipesMock).toHaveBeenCalled();
  });
});
