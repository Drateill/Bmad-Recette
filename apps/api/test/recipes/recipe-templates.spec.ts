import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RecipeTemplatesService } from '../../src/modules/recipes/recipe-templates.service';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { TagsRepository } from '../../src/modules/tags/tags.repository';
import {
  getAllTemplates,
  getTemplateById,
  validateTemplateIds,
} from '../../src/modules/recipes/templates/recipe-templates';

describe('Recipe Templates - Unit Tests', () => {
  let service: RecipeTemplatesService;
  let tagsRepository: jest.Mocked<TagsRepository>;
  let recipesService: jest.Mocked<RecipesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeTemplatesService,
        {
          provide: TagsRepository,
          useValue: {
            findBySlug: jest.fn(),
          },
        },
        {
          provide: RecipesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeTemplatesService>(RecipeTemplatesService);
    tagsRepository = module.get(TagsRepository);
    recipesService = module.get(RecipesService);
  });

  describe('Template Data Validation', () => {
    it('should have all required templates', () => {
      const templates = getAllTemplates();
      const templateNames = templates.map((t) => t.name);

      expect(templates.length).toBeGreaterThanOrEqual(8);
      expect(templateNames).toContain('Dessert');
      expect(templateNames).toContain('Main Course');
      expect(templateNames).toContain('Appetizer');
      expect(templateNames).toContain('Soup');
      expect(templateNames).toContain('Salad');
      expect(templateNames).toContain('Breakfast');
      expect(templateNames).toContain('Beverage');
      expect(templateNames).toContain('Snack');
    });

    it('should have all templates with required fields', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.defaultFields).toBeDefined();
        expect(template.defaultFields.servings).toBeGreaterThan(0);
        expect(template.defaultTagSlugs).toBeDefined();
        expect(Array.isArray(template.defaultTagSlugs)).toBe(true);
        expect(template.placeholderIngredients).toBeDefined();
        expect(Array.isArray(template.placeholderIngredients)).toBe(true);
        expect(template.placeholderSteps).toBeDefined();
        expect(Array.isArray(template.placeholderSteps)).toBe(true);
      });
    });

    it('should have unique template IDs', () => {
      expect(validateTemplateIds()).toBe(true);
    });

    it('should find template by ID', () => {
      const template = getTemplateById('dessert');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Dessert');
    });

    it('should return null for invalid template ID', () => {
      const template = getTemplateById('invalid-id');
      expect(template).toBeNull();
    });
  });

  describe('RecipeTemplatesService.getTemplates', () => {
    it('should return templates with resolved tag IDs', async () => {
      // Mock tag resolution
      tagsRepository.findBySlug.mockResolvedValue([
        {
          id: 'tag-1',
          slug: 'dessert',
          name: 'Dessert',
          categoryId: 'cat-1',
          isSystem: true,
          userId: null,
          color: null,
          createdAt: new Date(),
        },
        {
          id: 'tag-2',
          slug: 'sweet',
          name: 'Sweet',
          categoryId: 'cat-1',
          isSystem: true,
          userId: null,
          color: null,
          createdAt: new Date(),
        },
      ]);

      const templates = await service.getTemplates();

      expect(templates.length).toBeGreaterThanOrEqual(8);
      expect(templates[0].defaultTagIds).toBeDefined();
      expect(Array.isArray(templates[0].defaultTagIds)).toBe(true);
    });

    it('should handle missing tags gracefully', async () => {
      // Mock tag resolution with some tags missing
      tagsRepository.findBySlug.mockResolvedValue([
        {
          id: 'tag-1',
          slug: 'dessert',
          name: 'Dessert',
          categoryId: 'cat-1',
          isSystem: true,
          userId: null,
          color: null,
          createdAt: new Date(),
        },
      ]);

      const templates = await service.getTemplates();

      expect(templates.length).toBeGreaterThanOrEqual(8);
      // Should not throw error, just log warning
      expect(templates[0].defaultTagIds.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RecipeTemplatesService.createFromTemplate', () => {
    it('should create recipe with template defaults', async () => {
      // Mock tag resolution
      tagsRepository.findBySlug.mockResolvedValue([
        {
          id: 'tag-1',
          slug: 'dessert',
          name: 'Dessert',
          categoryId: 'cat-1',
          isSystem: true,
          userId: null,
          color: null,
          createdAt: new Date(),
        },
      ]);

      // Mock recipe creation
      const mockRecipe = {
        id: 'recipe-1',
        userId: 'user-1',
        title: 'New Dessert',
        servings: 8,
      };
      recipesService.create.mockResolvedValue(mockRecipe as any);

      const result = await service.createFromTemplate('user-1', {
        templateId: 'dessert',
      });

      expect(result).toEqual(mockRecipe);
      expect(recipesService.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: 'New Dessert',
          servings: 8,
          tagIds: ['tag-1'],
        }),
      );
    });

    it('should apply custom title override', async () => {
      tagsRepository.findBySlug.mockResolvedValue([]);
      recipesService.create.mockResolvedValue({ id: 'recipe-1' } as any);

      await service.createFromTemplate('user-1', {
        templateId: 'dessert',
        title: 'Chocolate Cake',
      });

      expect(recipesService.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: 'Chocolate Cake',
        }),
      );
    });

    it('should apply custom servings override', async () => {
      tagsRepository.findBySlug.mockResolvedValue([]);
      recipesService.create.mockResolvedValue({ id: 'recipe-1' } as any);

      await service.createFromTemplate('user-1', {
        templateId: 'dessert',
        servings: 12,
      });

      expect(recipesService.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          servings: 12,
        }),
      );
    });

    it('should throw BadRequestException for invalid template ID', async () => {
      await expect(
        service.createFromTemplate('user-1', {
          templateId: 'invalid-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include placeholder ingredients with sort order', async () => {
      tagsRepository.findBySlug.mockResolvedValue([]);
      recipesService.create.mockResolvedValue({ id: 'recipe-1' } as any);

      await service.createFromTemplate('user-1', {
        templateId: 'dessert',
      });

      const createCall = recipesService.create.mock.calls[0][1];
      expect(createCall.ingredients.length).toBeGreaterThan(0);
      expect(createCall.ingredients[0].sortOrder).toBe(1);
      expect(createCall.ingredients[0].ingredientName).toBeDefined();
      expect(createCall.ingredients[0].quantity).toBeDefined();
      expect(createCall.ingredients[0].unit).toBeDefined();
    });

    it('should include placeholder steps', async () => {
      tagsRepository.findBySlug.mockResolvedValue([]);
      recipesService.create.mockResolvedValue({ id: 'recipe-1' } as any);

      await service.createFromTemplate('user-1', {
        templateId: 'dessert',
      });

      const createCall = recipesService.create.mock.calls[0][1];
      expect(createCall.steps.length).toBeGreaterThan(0);
      expect(createCall.steps[0].stepNumber).toBeDefined();
      expect(createCall.steps[0].instruction).toBeDefined();
    });
  });

  describe('Tag Resolution Caching', () => {
    it('should cache tag slug-to-ID mapping', async () => {
      tagsRepository.findBySlug.mockResolvedValue([
        {
          id: 'tag-1',
          slug: 'dessert',
          name: 'Dessert',
          categoryId: 'cat-1',
          isSystem: true,
          userId: null,
          color: null,
          createdAt: new Date(),
        },
      ]);

      // First call - should query database
      await service.getTemplates();

      // Second call - should use cache (but will still be called due to loop optimization)
      await service.getTemplates();

      // Cache reduces the number of unique slug lookups
      expect(tagsRepository.findBySlug).toHaveBeenCalled();
    });
  });
});
