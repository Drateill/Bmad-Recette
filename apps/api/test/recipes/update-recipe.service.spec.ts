import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';
import { PrismaService } from '../../src/database/prisma.service';
import { PortionAdjustmentService } from '../../src/modules/recipes/portion-adjustment.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { UpdateRecipeDto } from '../../src/modules/recipes/dto/update-recipe.dto';

describe('RecipesService.update', () => {
  let service: RecipesService;
  let repository: RecipesRepository;
  let prisma: PrismaService;

  const mockRecipe = {
    id: 'recipe-123',
    userId: 'user-123',
    title: 'Original Recipe',
    description: 'Original description',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    rating: null,
    source: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      {
        id: 'ing-1',
        recipeId: 'recipe-123',
        ingredientId: 'cat-ing-1',
        ingredientName: 'Flour',
        quantity: 2,
        unit: 'cups',
        notes: null,
        sortOrder: 1,
        ingredient: {
          id: 'cat-ing-1',
          name: 'Flour',
          category: 'Grains',
          commonUnits: ['cups', 'grams'],
        },
      },
    ],
    steps: [
      {
        id: 'step-1',
        recipeId: 'recipe-123',
        stepNumber: 1,
        instruction: 'Mix ingredients',
        duration: null,
      },
    ],
    tags: [
      {
        recipeId: 'recipe-123',
        tagId: 'tag-1',
        createdAt: new Date(),
        tag: {
          id: 'tag-1',
          name: 'Quick',
          slug: 'quick',
          color: '#00FF00',
          categoryId: 'cat-1',
          category: {
            id: 'cat-1',
            name: 'Time',
            slug: 'time',
          },
        },
      },
    ],
    photos: [],
  };

  const mockPrismaService = {
    tag: {
      findMany: jest.fn(),
    },
    ingredient: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockRecipesRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: mockRecipesRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: {},
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
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update all fields successfully', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Updated Recipe',
        description: 'Updated description',
        prepTime: 15,
        cookTime: 25,
        servings: 6,
      };

      const updatedRecipe = {
        ...mockRecipe,
        ...updateDto,
        version: 2,
        updatedAt: new Date(),
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(repository.findById).toHaveBeenCalledWith('recipe-123');
      expect(repository.update).toHaveBeenCalledWith('recipe-123', updateDto);
      expect(result.title).toBe('Updated Recipe');
      expect(result.prepTime).toBe(15);
      expect(result.version).toBe(2);
    });

    it('should support partial update - only title changed', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Only Title Changed',
      };

      const updatedRecipe = {
        ...mockRecipe,
        title: 'Only Title Changed',
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.title).toBe('Only Title Changed');
      expect(result.description).toBe(mockRecipe.description);
      expect(result.prepTime).toBe(mockRecipe.prepTime);
    });

    it('should replace ingredients array', async () => {
      const updateDto: UpdateRecipeDto = {
        ingredients: [
          {
            quantity: 3,
            unit: 'cups',
            ingredientName: 'Sugar',
            ingredientId: 'cat-ing-2',
          },
          {
            quantity: 1,
            unit: 'tsp',
            ingredientName: 'Salt',
          },
        ],
      };

      const updatedRecipe = {
        ...mockRecipe,
        ingredients: [
          {
            id: 'ing-new-1',
            recipeId: 'recipe-123',
            ingredientId: 'cat-ing-2',
            ingredientName: 'Sugar',
            quantity: 3,
            unit: 'cups',
            notes: null,
            sortOrder: 1,
            ingredient: {
              id: 'cat-ing-2',
              name: 'Sugar',
              category: 'Sweeteners',
              commonUnits: ['cups', 'grams'],
            },
          },
          {
            id: 'ing-new-2',
            recipeId: 'recipe-123',
            ingredientId: null,
            ingredientName: 'Salt',
            quantity: 1,
            unit: 'tsp',
            notes: null,
            sortOrder: 2,
            ingredient: null,
          },
        ],
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.ingredient.findUnique.mockResolvedValue({
        id: 'cat-ing-2',
        name: 'Sugar',
      });
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0].ingredientName).toBe('Sugar');
      expect(result.ingredients[1].ingredientName).toBe('Salt');
    });

    it('should replace steps array', async () => {
      const updateDto: UpdateRecipeDto = {
        steps: [
          { instruction: 'New step 1' },
          { instruction: 'New step 2', duration: 10 },
        ],
      };

      const updatedRecipe = {
        ...mockRecipe,
        steps: [
          {
            id: 'step-new-1',
            recipeId: 'recipe-123',
            stepNumber: 1,
            instruction: 'New step 1',
            duration: null,
          },
          {
            id: 'step-new-2',
            recipeId: 'recipe-123',
            stepNumber: 2,
            instruction: 'New step 2',
            duration: 10,
          },
        ],
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].instruction).toBe('New step 1');
      expect(result.steps[1].instruction).toBe('New step 2');
    });

    it('should update tags using upsert logic', async () => {
      const updateDto: UpdateRecipeDto = {
        tagIds: ['tag-2', 'tag-3'],
      };

      const updatedRecipe = {
        ...mockRecipe,
        tags: [
          {
            recipeId: 'recipe-123',
            tagId: 'tag-2',
            createdAt: new Date(),
            tag: {
              id: 'tag-2',
              name: 'Easy',
              slug: 'easy',
              color: '#0000FF',
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Difficulty', slug: 'difficulty' },
            },
          },
          {
            recipeId: 'recipe-123',
            tagId: 'tag-3',
            createdAt: new Date(),
            tag: {
              id: 'tag-3',
              name: 'Healthy',
              slug: 'healthy',
              color: '#FF0000',
              categoryId: 'cat-2',
              category: { id: 'cat-2', name: 'Diet', slug: 'diet' },
            },
          },
        ],
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: 'tag-2' },
        { id: 'tag-3' },
      ]);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['tag-2', 'tag-3'] } },
      });
      expect(result.tags).toHaveLength(2);
    });
  });

  describe('optimistic locking', () => {
    it('should throw ConflictException when version mismatch detected', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Updated Title',
        expectedVersion: 1,
      };

      const staleRecipe = { ...mockRecipe, version: 2 };
      mockRecipesRepository.findById.mockResolvedValue(staleRecipe);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow(
        'Recipe was modified by another user. Please refresh and try again.',
      );
    });

    it('should succeed when expectedVersion matches current version', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Updated Title',
        expectedVersion: 1,
      };

      const updatedRecipe = {
        ...mockRecipe,
        title: 'Updated Title',
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(result.version).toBe(2);
    });

    it('should not check version when expectedVersion not provided', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Updated Title',
      };

      const updatedRecipe = {
        ...mockRecipe,
        title: 'Updated Title',
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('authorization', () => {
    it('should throw ForbiddenException when user does not own recipe', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Hacker Title',
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);

      await expect(
        service.update('recipe-123', 'different-user', updateDto),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('recipe-123', 'different-user', updateDto),
      ).rejects.toThrow('You do not own this recipe');
    });

    it('should succeed when user owns recipe', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Legitimate Update',
      };

      const updatedRecipe = {
        ...mockRecipe,
        title: 'Legitimate Update',
        version: 2,
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockRecipesRepository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('recipe-123', 'user-123', updateDto);

      expect(result.title).toBe('Legitimate Update');
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundException when recipe does not exist', async () => {
      const updateDto: UpdateRecipeDto = {
        title: 'Updated Title',
      };

      mockRecipesRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-recipe', 'user-123', updateDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update('nonexistent-recipe', 'user-123', updateDto),
      ).rejects.toThrow('Recipe not found');
    });

    it('should throw BadRequestException for invalid tag IDs', async () => {
      const updateDto: UpdateRecipeDto = {
        tagIds: ['tag-1', 'invalid-tag'],
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow('One or more tag IDs are invalid');
    });

    it('should throw BadRequestException for invalid ingredient ID', async () => {
      const updateDto: UpdateRecipeDto = {
        ingredients: [
          {
            quantity: 2,
            unit: 'cups',
            ingredientName: 'Flour',
            ingredientId: 'invalid-ingredient-id',
          },
        ],
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update('recipe-123', 'user-123', updateDto),
      ).rejects.toThrow('Ingredient with ID invalid-ingredient-id not found');
    });
  });

  describe('ingredient catalog lookup', () => {
    it('should lookup catalog ingredient by name when ingredientId not provided', async () => {
      const updateDto: UpdateRecipeDto = {
        ingredients: [
          {
            quantity: 2,
            unit: 'cups',
            ingredientName: 'flour',
          },
        ],
      };

      const catalogIngredient = {
        id: 'cat-ing-1',
        name: 'Flour',
        category: 'Grains',
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(
        catalogIngredient,
      );
      mockRecipesRepository.update.mockResolvedValue({
        ...mockRecipe,
        version: 2,
      });

      await service.update('recipe-123', 'user-123', updateDto);

      expect(prisma.ingredient.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'flour',
            mode: 'insensitive',
          },
        },
      });

      expect(updateDto.ingredients![0].ingredientId).toBe('cat-ing-1');
      expect(updateDto.ingredients![0].ingredientName).toBe('Flour');
    });

    it('should allow custom ingredients when not found in catalog', async () => {
      const updateDto: UpdateRecipeDto = {
        ingredients: [
          {
            quantity: 1,
            unit: 'pinch',
            ingredientName: 'Fairy Dust',
          },
        ],
      };

      mockRecipesRepository.findById.mockResolvedValue(mockRecipe);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.update.mockResolvedValue({
        ...mockRecipe,
        version: 2,
      });

      await service.update('recipe-123', 'user-123', updateDto);

      expect(updateDto.ingredients![0].ingredientId).toBeUndefined();
      expect(updateDto.ingredients![0].ingredientName).toBe('Fairy Dust');
    });
  });
});
