import { PrismaClient } from '@prisma/client';

describe('Tag Models Validation', () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let recipeId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Create a test user for foreign key relationships
    const testUser = await prisma.user.create({
      data: {
        email: `test-tag-${Date.now()}@example.com`,
        firstName: 'TagTest',
      },
    });
    testUserId = testUser.id;

    // Create a test recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId: testUserId,
        title: 'Test Recipe for Tags',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
      },
    });
    recipeId = recipe.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.recipe.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('TagCategory Model', () => {
    it('should create a tag category with all required fields', async () => {
      const category = await prisma.tagCategory.create({
        data: {
          name: `Test Category ${Date.now()}`,
          slug: `test-category-${Date.now()}`,
          sortOrder: 10,
        },
      });

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toContain('Test Category');
      expect(category.slug).toContain('test-category');
      expect(category.sortOrder).toBe(10);
      expect(category.createdAt).toBeDefined();

      await prisma.tagCategory.delete({ where: { id: category.id } });
    });

    it('should enforce unique constraint on slug', async () => {
      const uniqueSlug = `unique-slug-${Date.now()}`;

      const category1 = await prisma.tagCategory.create({
        data: {
          name: 'Category 1',
          slug: uniqueSlug,
          sortOrder: 1,
        },
      });

      await expect(
        prisma.tagCategory.create({
          data: {
            name: 'Category 2',
            slug: uniqueSlug, // Duplicate slug
            sortOrder: 2,
          },
        }),
      ).rejects.toThrow();

      await prisma.tagCategory.delete({ where: { id: category1.id } });
    });
  });

  describe('Tag Model - System Tags', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.tagCategory.create({
        data: {
          name: `Test Category ${Date.now()}`,
          slug: `test-cat-${Date.now()}`,
          sortOrder: 1,
        },
      });
      categoryId = category.id;
    });

    afterEach(async () => {
      await prisma.tag.deleteMany({ where: { categoryId } });
      await prisma.tagCategory.delete({ where: { id: categoryId } });
    });

    it('should create a system tag with isSystem=true and userId=null', async () => {
      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'Vegetarian',
          slug: 'vegetarian',
          isSystem: true,
          userId: null,
        },
      });

      expect(tag).toBeDefined();
      expect(tag.id).toBeDefined();
      expect(tag.categoryId).toBe(categoryId);
      expect(tag.name).toBe('Vegetarian');
      expect(tag.slug).toBe('vegetarian');
      expect(tag.isSystem).toBe(true);
      expect(tag.userId).toBeNull();
      expect(tag.color).toBeNull();
      expect(tag.createdAt).toBeDefined();
    });

    it('should have default isSystem=false when not specified', async () => {
      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'Custom Tag',
          slug: 'custom-tag',
          userId: testUserId,
        },
      });

      expect(tag.isSystem).toBe(false);

      await prisma.tag.delete({ where: { id: tag.id } });
    });

    it('should allow optional color field', async () => {
      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'Colorful Tag',
          slug: 'colorful-tag',
          isSystem: true,
          userId: null,
          color: '#FF5733',
        },
      });

      expect(tag.color).toBe('#FF5733');

      await prisma.tag.delete({ where: { id: tag.id } });
    });
  });

  describe('Tag Model - User Tags', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.tagCategory.create({
        data: {
          name: `User Tag Category ${Date.now()}`,
          slug: `user-cat-${Date.now()}`,
          sortOrder: 1,
        },
      });
      categoryId = category.id;
    });

    afterEach(async () => {
      await prisma.tag.deleteMany({ where: { categoryId } });
      await prisma.tagCategory.delete({ where: { id: categoryId } });
    });

    it('should create a user tag with isSystem=false and userId set', async () => {
      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'My Custom Tag',
          slug: 'my-custom-tag',
          isSystem: false,
          userId: testUserId,
        },
      });

      expect(tag.isSystem).toBe(false);
      expect(tag.userId).toBe(testUserId);
    });

    it('should cascade delete user tags when user is deleted', async () => {
      // Create temporary user
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-tag-${Date.now()}@example.com`,
          firstName: 'TempTag',
        },
      });

      // Create user tag
      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'Temp Tag',
          slug: 'temp-tag',
          isSystem: false,
          userId: tempUser.id,
        },
      });

      // Delete user (should cascade delete tag)
      await prisma.user.delete({ where: { id: tempUser.id } });

      // Verify tag was deleted
      const deletedTag = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(deletedTag).toBeNull();
    });
  });

  describe('Tag Model - Unique Constraints', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.tagCategory.create({
        data: {
          name: `Constraint Category ${Date.now()}`,
          slug: `constraint-cat-${Date.now()}`,
          sortOrder: 1,
        },
      });
      categoryId = category.id;
    });

    afterEach(async () => {
      await prisma.tag.deleteMany({ where: { categoryId } });
      await prisma.tagCategory.delete({ where: { id: categoryId } });
    });

    it('should enforce unique constraint on (categoryId, slug) for system tags', async () => {
      await prisma.tag.create({
        data: {
          categoryId,
          name: 'Duplicate Test',
          slug: 'duplicate-system',
          isSystem: true,
          userId: null,
        },
      });

      await expect(
        prisma.tag.create({
          data: {
            categoryId,
            name: 'Duplicate Test 2',
            slug: 'duplicate-system', // Duplicate slug in same category
            isSystem: true,
            userId: null,
          },
        }),
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on (categoryId, slug, userId) for user tags', async () => {
      await prisma.tag.create({
        data: {
          categoryId,
          name: 'User Duplicate',
          slug: 'duplicate-user',
          isSystem: false,
          userId: testUserId,
        },
      });

      await expect(
        prisma.tag.create({
          data: {
            categoryId,
            name: 'User Duplicate 2',
            slug: 'duplicate-user', // Duplicate slug for same user in same category
            isSystem: false,
            userId: testUserId,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('RecipeTag Model', () => {
    let categoryId: string;
    let tagId: string;

    beforeEach(async () => {
      const category = await prisma.tagCategory.create({
        data: {
          name: `RecipeTag Category ${Date.now()}`,
          slug: `recipe-tag-cat-${Date.now()}`,
          sortOrder: 1,
        },
      });
      categoryId = category.id;

      const tag = await prisma.tag.create({
        data: {
          categoryId,
          name: 'Test Tag',
          slug: `test-tag-${Date.now()}`,
          isSystem: true,
          userId: null,
        },
      });
      tagId = tag.id;
    });

    afterEach(async () => {
      await prisma.recipeTag.deleteMany({ where: { recipeId } });
      await prisma.tag.deleteMany({ where: { categoryId } });
      await prisma.tagCategory.delete({ where: { id: categoryId } });
    });

    it('should create recipe tag linking recipe and tag', async () => {
      const recipeTag = await prisma.recipeTag.create({
        data: {
          recipeId,
          tagId,
        },
      });

      expect(recipeTag).toBeDefined();
      expect(recipeTag.id).toBeDefined();
      expect(recipeTag.recipeId).toBe(recipeId);
      expect(recipeTag.tagId).toBe(tagId);
      expect(recipeTag.createdAt).toBeDefined();
    });

    it('should enforce unique constraint on (recipeId, tagId) to prevent duplicates', async () => {
      await prisma.recipeTag.create({
        data: {
          recipeId,
          tagId,
        },
      });

      await expect(
        prisma.recipeTag.create({
          data: {
            recipeId,
            tagId, // Duplicate recipe-tag combination
          },
        }),
      ).rejects.toThrow();
    });

    it('should cascade delete when recipe is deleted', async () => {
      const recipeTag = await prisma.recipeTag.create({
        data: {
          recipeId,
          tagId,
        },
      });

      // Create new temporary recipe for deletion test
      const tempRecipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Temp Recipe for Cascade',
          prepTime: 5,
          cookTime: 10,
          servings: 1,
        },
      });

      const tempRecipeTag = await prisma.recipeTag.create({
        data: {
          recipeId: tempRecipe.id,
          tagId,
        },
      });

      await prisma.recipe.delete({ where: { id: tempRecipe.id } });

      const deleted = await prisma.recipeTag.findUnique({
        where: { id: tempRecipeTag.id },
      });
      expect(deleted).toBeNull();

      // Original recipeTag should still exist
      const existing = await prisma.recipeTag.findUnique({
        where: { id: recipeTag.id },
      });
      expect(existing).toBeDefined();
    });

    it('should cascade delete when tag is deleted', async () => {
      const recipeTag = await prisma.recipeTag.create({
        data: {
          recipeId,
          tagId,
        },
      });

      await prisma.tag.delete({ where: { id: tagId } });

      const deleted = await prisma.recipeTag.findUnique({
        where: { id: recipeTag.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('Seed Data - Tag System', () => {
    it('should have 6 tag categories seeded', async () => {
      const count = await prisma.tagCategory.count();
      expect(count).toBeGreaterThanOrEqual(6);

      const categories = await prisma.tagCategory.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const slugs = categories.map((c) => c.slug);
      expect(slugs).toContain('time-effort');
      expect(slugs).toContain('diet-health');
      expect(slugs).toContain('dish-type');
      expect(slugs).toContain('occasion');
      expect(slugs).toContain('world-cuisine');
      expect(slugs).toContain('budget');
    });

    it('should have 100+ system tags seeded', async () => {
      const count = await prisma.tag.count({
        where: { isSystem: true },
      });
      expect(count).toBeGreaterThanOrEqual(100);
    });

    it('should have system tags distributed across all categories', async () => {
      const tagsWithCategory = await prisma.tag.findMany({
        where: { isSystem: true },
        include: { category: true },
      });

      const categorySlugs = new Set(
        tagsWithCategory.map((t) => t.category.slug),
      );

      expect(categorySlugs.has('time-effort')).toBe(true);
      expect(categorySlugs.has('diet-health')).toBe(true);
      expect(categorySlugs.has('dish-type')).toBe(true);
      expect(categorySlugs.has('occasion')).toBe(true);
      expect(categorySlugs.has('world-cuisine')).toBe(true);
      expect(categorySlugs.has('budget')).toBe(true);
    });

    it('should have isSystem=true and userId=null for all seeded tags', async () => {
      const systemTags = await prisma.tag.findMany({
        where: { isSystem: true },
      });

      systemTags.forEach((tag) => {
        expect(tag.isSystem).toBe(true);
        expect(tag.userId).toBeNull();
      });
    });
  });
});
