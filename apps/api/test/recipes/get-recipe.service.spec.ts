import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';
import { PortionAdjustmentService } from '../../src/modules/recipes/portion-adjustment.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/database/prisma.service';

describe('RecipesService - findById', () => {
  let service: RecipesService;
  let repository: RecipesRepository;

  const mockUserId = 'user-123';
  const mockRecipeId = 'recipe-456';
  const otherUserId = 'user-789';

  const mockRecipe = {
    id: mockRecipeId,
    userId: mockUserId,
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    rating: 5,
    source: 'https://example.com',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    version: 1,
    ingredients: [
      {
        id: 'ing-1',
        recipeId: mockRecipeId,
        ingredientId: 'catalog-1',
        ingredientName: 'Flour',
        quantity: 2,
        unit: 'cups',
        notes: null,
        sortOrder: 1,
        ingredient: {
          id: 'catalog-1',
          name: 'Flour',
          category: 'Baking',
          commonUnits: ['cup', 'tbsp', 'g'],
        },
      },
      {
        id: 'ing-2',
        recipeId: mockRecipeId,
        ingredientId: null,
        ingredientName: 'Custom Ingredient',
        quantity: 1,
        unit: 'piece',
        notes: 'Special ingredient',
        sortOrder: 2,
        ingredient: null,
      },
    ],
    steps: [
      {
        id: 'step-1',
        recipeId: mockRecipeId,
        stepNumber: 1,
        instruction: 'Mix flour and water',
        duration: 5,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
      {
        id: 'step-2',
        recipeId: mockRecipeId,
        stepNumber: 2,
        instruction: 'Bake at 350F',
        duration: 30,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ],
    tags: [
      {
        id: 'recipe-tag-1',
        recipeId: mockRecipeId,
        tagId: 'tag-1',
        tag: {
          id: 'tag-1',
          categoryId: 'cat-1',
          name: 'Vegetarian',
          slug: 'vegetarian',
          isSystem: true,
          userId: null,
          color: '#00FF00',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          category: {
            id: 'cat-1',
            name: 'Dietary',
            slug: 'dietary',
            sortOrder: 1,
            createdAt: new Date('2025-01-01T00:00:00Z'),
          },
        },
      },
    ],
    photos: [
      {
        id: 'photo-1',
        recipeId: mockRecipeId,
        s3Url: 'https://s3.example.com/photo1.jpg',
        thumbnailUrl: 'https://s3.example.com/photo1-thumb.jpg',
        isPrimary: true,
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        uploadedAt: new Date('2025-01-01T00:00:00Z'),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            recipe: {},
          },
        },
        {
          provide: StorageService,
          useValue: {
            deleteFile: jest.fn(),
            extractKeyFromUrl: jest.fn(),
          },
        },
        {
          provide: PortionAdjustmentService,
          useValue: {
            adjustIngredients: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get<RecipesRepository>(RecipesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('successful retrieval', () => {
    it('should return recipe with all relations and computed fields', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(repository.findById).toHaveBeenCalledWith(mockRecipeId);
      expect(result).toMatchObject({
        id: mockRecipeId,
        userId: mockUserId,
        title: 'Test Recipe',
        totalTime: 45, // 15 + 30
        ingredientCount: 2,
        stepCount: 2,
      });
      expect(result.ingredients).toHaveLength(2);
      expect(result.steps).toHaveLength(2);
      expect(result.tags).toHaveLength(1);
      expect(result.photos).toHaveLength(1);
    });

    it('should calculate totalTime correctly (prepTime + cookTime)', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.totalTime).toBe(45);
    });

    it('should calculate ingredientCount correctly', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.ingredientCount).toBe(2);
    });

    it('should calculate stepCount correctly', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.stepCount).toBe(2);
    });

    it('should transform tags from RecipeTag[] to TagDto[]', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.tags[0]).toEqual({
        id: 'tag-1',
        name: 'Vegetarian',
        slug: 'vegetarian',
        color: '#00FF00',
        category: {
          id: 'cat-1',
          name: 'Dietary',
          slug: 'dietary',
        },
      });
    });
  });

  describe('recipe not found', () => {
    it('should throw NotFoundException when recipe does not exist', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.findById(mockRecipeId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(mockRecipeId, mockUserId)).rejects.toThrow(
        'Recipe not found',
      );
    });
  });

  describe('authorization', () => {
    it('should throw NotFoundException when user does not own recipe (security: prevent enumeration)', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      await expect(
        service.findById(mockRecipeId, otherUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findById(mockRecipeId, otherUserId),
      ).rejects.toThrow('Recipe not found');
    });
  });

  describe('edge cases', () => {
    it('should handle recipes with no ingredients', async () => {
      const recipeWithNoIngredients = {
        ...mockRecipe,
        ingredients: [],
      };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(recipeWithNoIngredients as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.ingredientCount).toBe(0);
      expect(result.ingredients).toEqual([]);
    });

    it('should handle recipes with no steps', async () => {
      const recipeWithNoSteps = {
        ...mockRecipe,
        steps: [],
      };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(recipeWithNoSteps as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.stepCount).toBe(0);
      expect(result.steps).toEqual([]);
    });

    it('should handle recipes with no photos', async () => {
      const recipeWithNoPhotos = {
        ...mockRecipe,
        photos: [],
      };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(recipeWithNoPhotos as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.photos).toEqual([]);
    });

    it('should handle null optional fields', async () => {
      const recipeWithNulls = {
        ...mockRecipe,
        description: null,
        rating: null,
        source: null,
      };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(recipeWithNulls as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.description).toBeNull();
      expect(result.rating).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should handle ingredients without catalog reference', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe as any);

      const result = await service.findById(mockRecipeId, mockUserId);

      expect(result.ingredients[1].ingredient).toBeNull();
      expect(result.ingredients[1].ingredientName).toBe('Custom Ingredient');
    });
  });
});
