import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { RecipeDetail } from '../RecipeDetail';
import { useRecipeDetail } from '../../hooks/useRecipeDetail';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../hooks/useRecipeDetail');
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  const { Pressable, Text } = require('react-native');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FAB: {
      ...actual.FAB,
      Group: ({ actions }: { actions?: Array<{ label: string; onPress: () => void }> }) => (
        <>
          {actions?.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              testID={`fab-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Text>{action.label}</Text>
            </Pressable>
          ))}
        </>
      ),
    },
  };
});
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { recipeId: 'recipe-1' },
    }),
  };
});

const mockUseRecipeDetail = useRecipeDetail as jest.Mock;

describe('RecipeDetail', () => {
  const recipe = {
    id: 'recipe-1',
    userId: 'user-1',
    title: 'Test Recipe',
    description: null,
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 2,
    rating: 4,
    source: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    ingredients: [
      {
        id: 'ingredient-1',
        recipeId: 'recipe-1',
        ingredientId: null,
        ingredientName: 'Tomato',
        quantity: 2,
        unit: 'pcs',
        notes: null,
        sortOrder: 1,
      },
    ],
    steps: [
      {
        id: 'step-1',
        recipeId: 'recipe-1',
        stepNumber: 1,
        instruction: 'Slice tomatoes.',
        duration: 5,
        createdAt: new Date(),
      },
    ],
    photos: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('activates and deactivates keep awake mode', () => {
    mockUseRecipeDetail.mockReturnValue({
      recipe,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    const keepAwake = require('expo-keep-awake');

    const { unmount, getByText } = render(
      <PaperProvider>
        <RecipeDetail />
      </PaperProvider>
    );
    expect(getByText('Test Recipe')).toBeTruthy();
    expect(keepAwake.activateKeepAwakeAsync).toHaveBeenCalled();

    unmount();
    expect(keepAwake.deactivateKeepAwake).toHaveBeenCalled();
  });

  it('renders recipe sections and handles FAB actions', () => {
    mockUseRecipeDetail.mockReturnValue({
      recipe,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText, getByTestId } = render(
      <PaperProvider>
        <RecipeDetail />
      </PaperProvider>
    );

    expect(getByText('Ingredients')).toBeTruthy();
    expect(getByText('Instructions')).toBeTruthy();

    fireEvent.press(getByTestId('fab-edit'));
    expect(mockNavigate).toHaveBeenCalledWith('RecipeEdit', {
      recipeId: 'recipe-1',
    });

    const { Share } = require('react-native');
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' });

    fireEvent.press(getByTestId('fab-share'));
    expect(shareSpy).toHaveBeenCalled();
    shareSpy.mockRestore();
  });
});
