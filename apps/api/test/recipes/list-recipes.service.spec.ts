import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';
import { PortionAdjustmentService } from '../../src/modules/recipes/portion-adjustment.service';
import { PrismaService } from '../../src/database/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { RecipeFilterDto } from '../../src/modules/recipes/dto/recipe-filter.dto';

describe('RecipesService - findAll', () => {
  let service: RecipesService;

  const mockRecipe = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    title: 'Test Recipe',
    description: 'Test Description',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    rating: 5,
    source: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1,
    photos: [
      {
        id: 'photo-123',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      },
    ],
    tags: [{ tagId: 'tag-123' }, { tagId: 'tag-456' }],
  };

  const mockRepositoryFindAll = jest.fn();
  const mockRepositoryCount = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: {
            findAll: mockRepositoryFindAll,
            count: mockRepositoryCount,
          },
        },
        {
          provide: PrismaService,
          useValue: {},
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('default pagination', () => {
    it('should return recipes with default page=1 and limit=20', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      const result = await service.findAll('user-123', filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockRecipe.id);
      expect(result.data[0].totalTime).toBe(45); // 15 + 30
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(mockRepositoryFindAll).toHaveBeenCalledWith('user-123', filters);
      expect(mockRepositoryCount).toHaveBeenCalledWith('user-123', filters);
    });
  });

  describe('custom pagination', () => {
    it('should return recipes with custom page=2 and limit=10', async () => {
      const filters: RecipeFilterDto = {
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(25);

      const result = await service.findAll('user-123', filters);

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3, // Math.ceil(25/10)
      });
    });
  });

  describe('sorting', () => {
    it('should sort by title ascending', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'title',
        sortOrder: 'asc',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      await service.findAll('user-123', filters);

      expect(mockRepositoryFindAll).toHaveBeenCalledWith('user-123', filters);
    });

    it('should sort by createdAt descending (default)', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      await service.findAll('user-123', filters);

      expect(mockRepositoryFindAll).toHaveBeenCalledWith('user-123', filters);
    });
  });

  describe('tag filtering', () => {
    it('should filter recipes by tag IDs (OR logic)', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        tagIds: ['tag-123', 'tag-456'],
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      const result = await service.findAll('user-123', filters);

      expect(result.data[0].tagIds).toEqual(['tag-123', 'tag-456']);
      expect(mockRepositoryFindAll).toHaveBeenCalledWith('user-123', filters);
    });
  });

  describe('search query', () => {
    it('should search recipes by query string', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'chicken',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      const result = await service.findAll('user-123', filters);

      expect(result.data).toHaveLength(1);
      expect(mockRepositoryFindAll).toHaveBeenCalledWith('user-123', filters);
    });
  });

  describe('time filtering', () => {
    it('should filter recipes by maxTotalTime (in-memory)', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        maxTotalTime: 60, // 60 minutes
      };

      const quickRecipe = { ...mockRecipe, prepTime: 10, cookTime: 20 }; // 30 total
      const slowRecipe = { ...mockRecipe, prepTime: 40, cookTime: 40 }; // 80 total

      mockRepositoryFindAll.mockResolvedValue([quickRecipe, slowRecipe]);

      const result = await service.findAll('user-123', filters);

      // Should only return the quick recipe (totalTime <= 60)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalTime).toBe(30);
      expect(result.pagination.total).toBe(1);
    });

    it('should exclude recipes exceeding maxTotalTime', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        maxTotalTime: 30,
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]); // 45 minutes total

      const result = await service.findAll('user-123', filters);

      expect(result.data).toHaveLength(0); // 45 > 30
    });
  });

  describe('pagination metadata', () => {
    it('should calculate totalPages correctly', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([]);
      mockRepositoryCount.mockResolvedValue(45);

      const result = await service.findAll('user-123', filters);

      expect(result.pagination.totalPages).toBe(3); // Math.ceil(45/20)
    });

    it('should return empty array when no recipes match', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([]);
      mockRepositoryCount.mockResolvedValue(0);

      const result = await service.findAll('user-123', filters);

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('response transformation', () => {
    it('should transform recipes to RecipeListItemDto format', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockRepositoryFindAll.mockResolvedValue([mockRecipe]);
      mockRepositoryCount.mockResolvedValue(1);

      const result = await service.findAll('user-123', filters);

      expect(result.data[0]).toEqual({
        id: mockRecipe.id,
        title: mockRecipe.title,
        description: mockRecipe.description,
        prepTime: mockRecipe.prepTime,
        cookTime: mockRecipe.cookTime,
        servings: mockRecipe.servings,
        rating: mockRecipe.rating,
        totalTime: 45,
        primaryPhoto: {
          id: 'photo-123',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
        tagIds: ['tag-123', 'tag-456'],
      });
    });

    it('should handle recipe without photo', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const recipeWithoutPhoto = { ...mockRecipe, photos: [] };
      mockRepositoryFindAll.mockResolvedValue([recipeWithoutPhoto]);
      mockRepositoryCount.mockResolvedValue(1);

      const result = await service.findAll('user-123', filters);

      expect(result.data[0].primaryPhoto).toBeNull();
    });
  });

  describe('combined filters', () => {
    it('should apply search + tags + time filters together', async () => {
      const filters: RecipeFilterDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'chicken',
        tagIds: ['tag-123'],
        maxTotalTime: 60,
      };

      const matchingRecipe = { ...mockRecipe, prepTime: 10, cookTime: 20 };
      mockRepositoryFindAll.mockResolvedValue([matchingRecipe]);

      const result = await service.findAll('user-123', filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalTime).toBe(30);
    });
  });
});
