import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';
import { PrismaService } from '../../src/database/prisma.service';
import { CreateRecipeDto } from '../../src/modules/recipes/dto/create-recipe.dto';

describe('RecipesService', () => {
  let service: RecipesService;

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
    createRecipe: jest.fn(),
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
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const tagId1 = '223e4567-e89b-12d3-a456-426614174001';
    const tagId2 = '223e4567-e89b-12d3-a456-426614174002';
    const ingredientId = '323e4567-e89b-12d3-a456-426614174003';

    const validRecipeDto: CreateRecipeDto = {
      title: 'Test Recipe',
      description: 'A delicious test recipe',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      ingredients: [
        {
          quantity: 2,
          unit: 'cups',
          ingredientName: 'flour',
        },
      ],
      steps: [
        {
          instruction: 'Mix ingredients',
        },
      ],
      tagIds: [tagId1, tagId2],
    };

    const mockCreatedRecipe = {
      id: '423e4567-e89b-12d3-a456-426614174004',
      userId,
      title: 'Test Recipe',
      description: 'A delicious test recipe',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      rating: null,
      source: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ingredients: [
        {
          id: '523e4567-e89b-12d3-a456-426614174005',
          recipeId: '423e4567-e89b-12d3-a456-426614174004',
          ingredientId: null,
          ingredientName: 'flour',
          quantity: 2,
          unit: 'cups',
          notes: null,
          sortOrder: 1,
        },
      ],
      steps: [
        {
          id: '623e4567-e89b-12d3-a456-426614174006',
          recipeId: '423e4567-e89b-12d3-a456-426614174004',
          stepNumber: 1,
          instruction: 'Mix ingredients',
          duration: null,
          createdAt: new Date(),
        },
      ],
      tags: [
        {
          id: '723e4567-e89b-12d3-a456-426614174007',
          recipeId: '423e4567-e89b-12d3-a456-426614174004',
          tagId: tagId1,
          createdAt: new Date(),
          tag: {
            id: tagId1,
            name: 'Breakfast',
            slug: 'breakfast',
            categoryId: '823e4567-e89b-12d3-a456-426614174008',
            isSystem: true,
            userId: null,
            color: '#FF5722',
            createdAt: new Date(),
          },
        },
      ],
      photos: [],
    };

    it('should create a recipe successfully with all fields', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: tagId1 },
        { id: tagId2 },
      ]);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.createRecipe.mockResolvedValue(mockCreatedRecipe);

      const result = await service.create(userId, validRecipeDto);

      expect(result).toEqual(mockCreatedRecipe);
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: [tagId1, tagId2] } },
      });
      expect(mockRecipesRepository.createRecipe).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          title: 'Test Recipe',
          prepTime: 15,
          cookTime: 30,
        }),
      );
    });

    it('should create a recipe with minimum fields', async () => {
      const minimalDto: CreateRecipeDto = {
        title: 'Minimal Recipe',
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        ingredients: [
          {
            quantity: 1,
            unit: 'piece',
            ingredientName: 'egg',
          },
        ],
        steps: [
          {
            instruction: 'Cook the egg',
          },
        ],
        tagIds: [],
      };

      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.createRecipe.mockResolvedValue({
        ...mockCreatedRecipe,
        title: 'Minimal Recipe',
      });

      const result = await service.create(userId, minimalDto);

      expect(result).toBeDefined();
      expect(mockRecipesRepository.createRecipe).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid tagId', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([{ id: tagId1 }]);

      await expect(service.create(userId, validRecipeDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(userId, validRecipeDto)).rejects.toThrow(
        'One or more tag IDs are invalid',
      );
    });

    it('should throw BadRequestException for invalid ingredientId', async () => {
      const dtoWithIngredientId: CreateRecipeDto = {
        ...validRecipeDto,
        ingredients: [
          {
            quantity: 2,
            unit: 'cups',
            ingredientId,
            ingredientName: 'flour',
          },
        ],
      };

      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: tagId1 },
        { id: tagId2 },
      ]);
      mockPrismaService.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.create(userId, dtoWithIngredientId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(userId, dtoWithIngredientId),
      ).rejects.toThrow(`Ingredient with ID ${ingredientId} not found`);
    });

    it('should handle custom ingredient (ingredientId=null)', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: tagId1 },
        { id: tagId2 },
      ]);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.createRecipe.mockResolvedValue(mockCreatedRecipe);

      const result = await service.create(userId, validRecipeDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.ingredient.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'flour',
            mode: 'insensitive',
          },
        },
      });
    });

    it('should lookup catalog ingredient by name (case-insensitive)', async () => {
      const catalogIngredient = {
        id: ingredientId,
        name: 'Flour',
        category: 'Baking',
        commonUnits: ['cups', 'grams'],
        averagePrice: null,
        priceUnit: null,
        createdAt: new Date(),
      };

      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: tagId1 },
        { id: tagId2 },
      ]);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(
        catalogIngredient,
      );
      mockRecipesRepository.createRecipe.mockResolvedValue(mockCreatedRecipe);

      await service.create(userId, validRecipeDto);

      expect(mockRecipesRepository.createRecipe).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              ingredientId: ingredientId,
              ingredientName: 'Flour',
            }),
          ]),
        }),
      );
    });

    it('should auto-assign stepNumbers when omitted', async () => {
      const dtoWithMultipleSteps: CreateRecipeDto = {
        title: 'Multi-step Recipe',
        description: 'Test description',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        ingredients: [
          {
            quantity: 2,
            unit: 'cups',
            ingredientName: 'flour',
          },
        ],
        steps: [
          { instruction: 'Step 1' },
          { instruction: 'Step 2' },
          { instruction: 'Step 3' },
        ],
        tagIds: [tagId1, tagId2],
      };

      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: tagId1 },
        { id: tagId2 },
      ]);
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);
      mockRecipesRepository.createRecipe.mockResolvedValue(mockCreatedRecipe);

      await service.create(userId, dtoWithMultipleSteps);

      expect(mockRecipesRepository.createRecipe).toHaveBeenCalled();
    });
  });
});
