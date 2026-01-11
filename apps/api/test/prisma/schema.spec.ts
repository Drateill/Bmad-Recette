import { PrismaClient } from '@prisma/client';

describe('Prisma Schema Validation', () => {
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Create a test user for foreign key relationships
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
      },
    });
    testUserId = testUser.id;
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

  describe('Recipe Model', () => {
    it('should create a recipe with all required fields', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Test Recipe',
          description: 'A test recipe description',
          prepTime: 15,
          cookTime: 30,
          servings: 4,
          rating: 5,
          source: 'Test Source',
        },
      });

      expect(recipe).toBeDefined();
      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBe('Test Recipe');
      expect(recipe.prepTime).toBe(15);
      expect(recipe.cookTime).toBe(30);
      expect(recipe.servings).toBe(4);
      expect(recipe.rating).toBe(5);
      expect(recipe.version).toBe(1); // Default value
      expect(recipe.createdAt).toBeDefined();
      expect(recipe.updatedAt).toBeDefined();

      await prisma.recipe.delete({ where: { id: recipe.id } });
    });

    it('should enforce foreign key constraint on userId', async () => {
      await expect(
        prisma.recipe.create({
          data: {
            userId: '00000000-0000-0000-0000-000000000000', // Non-existent user
            title: 'Invalid Recipe',
            prepTime: 10,
            cookTime: 20,
            servings: 2,
          },
        }),
      ).rejects.toThrow();
    });

    it('should cascade delete recipes when user is deleted', async () => {
      // Create temporary user
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-${Date.now()}@example.com`,
          firstName: 'Temp',
        },
      });

      // Create recipe for temp user
      const recipe = await prisma.recipe.create({
        data: {
          userId: tempUser.id,
          title: 'Temp Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
        },
      });

      // Delete user (should cascade delete recipe)
      await prisma.user.delete({ where: { id: tempUser.id } });

      // Verify recipe was deleted
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
      });
      expect(deletedRecipe).toBeNull();
    });

    it('should allow nullable fields', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Simple Recipe',
          description: null, // Nullable
          prepTime: 10,
          cookTime: 20,
          servings: 2,
          rating: null, // Nullable
          source: null, // Nullable
        },
      });

      expect(recipe.description).toBeNull();
      expect(recipe.rating).toBeNull();
      expect(recipe.source).toBeNull();

      await prisma.recipe.delete({ where: { id: recipe.id } });
    });

    it('should have default version of 1', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Versioned Recipe',
          prepTime: 5,
          cookTime: 10,
          servings: 1,
        },
      });

      expect(recipe.version).toBe(1);

      await prisma.recipe.delete({ where: { id: recipe.id } });
    });
  });

  describe('Ingredient Model', () => {
    it('should create an ingredient with all fields', async () => {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: `Test Ingredient ${Date.now()}`,
          category: 'Produce',
          commonUnits: ['cup', 'g', 'oz'],
          averagePrice: 2.99,
          priceUnit: 'lbs',
        },
      });

      expect(ingredient).toBeDefined();
      expect(ingredient.id).toBeDefined();
      expect(ingredient.name).toContain('Test Ingredient');
      expect(ingredient.category).toBe('Produce');
      expect(ingredient.commonUnits).toEqual(['cup', 'g', 'oz']);
      expect(ingredient.averagePrice).toBe(2.99);
      expect(ingredient.priceUnit).toBe('lbs');
      expect(ingredient.createdAt).toBeDefined();

      await prisma.ingredient.delete({ where: { id: ingredient.id } });
    });

    it('should enforce unique constraint on name', async () => {
      const uniqueName = `Unique Ingredient ${Date.now()}`;

      const ingredient1 = await prisma.ingredient.create({
        data: {
          name: uniqueName,
          category: 'Pantry',
          commonUnits: ['cup'],
        },
      });

      await expect(
        prisma.ingredient.create({
          data: {
            name: uniqueName, // Duplicate name
            category: 'Spices',
            commonUnits: ['tsp'],
          },
        }),
      ).rejects.toThrow();

      await prisma.ingredient.delete({ where: { id: ingredient1.id } });
    });

    it('should allow nullable averagePrice and priceUnit', async () => {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: `No Price Ingredient ${Date.now()}`,
          category: 'Other',
          commonUnits: ['pc'],
          averagePrice: null,
          priceUnit: null,
        },
      });

      expect(ingredient.averagePrice).toBeNull();
      expect(ingredient.priceUnit).toBeNull();

      await prisma.ingredient.delete({ where: { id: ingredient.id } });
    });
  });

  describe('RecipeIngredient Model', () => {
    let recipeId: string;
    let ingredientId: string;

    beforeEach(async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Recipe for Ingredients Test',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
        },
      });
      recipeId = recipe.id;

      const ingredient = await prisma.ingredient.create({
        data: {
          name: `Test Ingredient ${Date.now()}`,
          category: 'Produce',
          commonUnits: ['cup'],
        },
      });
      ingredientId = ingredient.id;
    });

    afterEach(async () => {
      await prisma.recipe.deleteMany({ where: { id: recipeId } });
      await prisma.ingredient.deleteMany({ where: { id: ingredientId } });
    });

    it('should create recipe ingredient with linked ingredient', async () => {
      const recipeIngredient = await prisma.recipeIngredient.create({
        data: {
          recipeId,
          ingredientId,
          ingredientName: 'Tomato',
          quantity: 2,
          unit: 'cup',
          notes: 'Diced',
          sortOrder: 1,
        },
      });

      expect(recipeIngredient).toBeDefined();
      expect(recipeIngredient.recipeId).toBe(recipeId);
      expect(recipeIngredient.ingredientId).toBe(ingredientId);
      expect(recipeIngredient.ingredientName).toBe('Tomato');
      expect(recipeIngredient.quantity).toBe(2);
      expect(recipeIngredient.unit).toBe('cup');
      expect(recipeIngredient.sortOrder).toBe(1);

      await prisma.recipeIngredient.delete({ where: { id: recipeIngredient.id } });
    });

    it('should allow custom ingredient (null ingredientId)', async () => {
      const recipeIngredient = await prisma.recipeIngredient.create({
        data: {
          recipeId,
          ingredientId: null, // Custom ingredient not in catalog
          ingredientName: 'Custom Spice Blend',
          quantity: 1,
          unit: 'tbsp',
          sortOrder: 2,
        },
      });

      expect(recipeIngredient.ingredientId).toBeNull();
      expect(recipeIngredient.ingredientName).toBe('Custom Spice Blend');

      await prisma.recipeIngredient.delete({ where: { id: recipeIngredient.id } });
    });

    it('should cascade delete when recipe is deleted', async () => {
      const recipeIngredient = await prisma.recipeIngredient.create({
        data: {
          recipeId,
          ingredientName: 'Test',
          quantity: 1,
          unit: 'cup',
          sortOrder: 1,
        },
      });

      await prisma.recipe.delete({ where: { id: recipeId } });

      const deleted = await prisma.recipeIngredient.findUnique({
        where: { id: recipeIngredient.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('RecipeStep Model', () => {
    let recipeId: string;

    beforeEach(async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Recipe for Steps Test',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
        },
      });
      recipeId = recipe.id;
    });

    afterEach(async () => {
      await prisma.recipe.deleteMany({ where: { id: recipeId } });
    });

    it('should create recipe step with all fields', async () => {
      const step = await prisma.recipeStep.create({
        data: {
          recipeId,
          stepNumber: 1,
          instruction: 'Heat oil in a pan',
          duration: 5,
        },
      });

      expect(step).toBeDefined();
      expect(step.recipeId).toBe(recipeId);
      expect(step.stepNumber).toBe(1);
      expect(step.instruction).toBe('Heat oil in a pan');
      expect(step.duration).toBe(5);
      expect(step.createdAt).toBeDefined();

      await prisma.recipeStep.delete({ where: { id: step.id } });
    });

    it('should allow nullable duration', async () => {
      const step = await prisma.recipeStep.create({
        data: {
          recipeId,
          stepNumber: 2,
          instruction: 'Add ingredients',
          duration: null,
        },
      });

      expect(step.duration).toBeNull();

      await prisma.recipeStep.delete({ where: { id: step.id } });
    });

    it('should cascade delete when recipe is deleted', async () => {
      const step = await prisma.recipeStep.create({
        data: {
          recipeId,
          stepNumber: 1,
          instruction: 'Test instruction',
        },
      });

      await prisma.recipe.delete({ where: { id: recipeId } });

      const deleted = await prisma.recipeStep.findUnique({
        where: { id: step.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('RecipePhoto Model', () => {
    let recipeId: string;

    beforeEach(async () => {
      const recipe = await prisma.recipe.create({
        data: {
          userId: testUserId,
          title: 'Recipe for Photos Test',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
        },
      });
      recipeId = recipe.id;
    });

    afterEach(async () => {
      await prisma.recipe.deleteMany({ where: { id: recipeId } });
    });

    it('should create recipe photo with all fields', async () => {
      const photo = await prisma.recipePhoto.create({
        data: {
          recipeId,
          s3Url: 'https://s3.amazonaws.com/bucket/photo.jpg',
          thumbnailUrl: 'https://s3.amazonaws.com/bucket/photo_thumb.jpg',
          isPrimary: true,
          fileSize: 1024000,
          width: 1920,
          height: 1080,
        },
      });

      expect(photo).toBeDefined();
      expect(photo.recipeId).toBe(recipeId);
      expect(photo.s3Url).toContain('photo.jpg');
      expect(photo.thumbnailUrl).toContain('photo_thumb.jpg');
      expect(photo.isPrimary).toBe(true);
      expect(photo.fileSize).toBe(1024000);
      expect(photo.width).toBe(1920);
      expect(photo.height).toBe(1080);
      expect(photo.uploadedAt).toBeDefined();

      await prisma.recipePhoto.delete({ where: { id: photo.id } });
    });

    it('should have default isPrimary of false', async () => {
      const photo = await prisma.recipePhoto.create({
        data: {
          recipeId,
          s3Url: 'https://s3.amazonaws.com/bucket/photo2.jpg',
          thumbnailUrl: 'https://s3.amazonaws.com/bucket/photo2_thumb.jpg',
          fileSize: 512000,
          width: 1024,
          height: 768,
        },
      });

      expect(photo.isPrimary).toBe(false);

      await prisma.recipePhoto.delete({ where: { id: photo.id } });
    });

    it('should cascade delete when recipe is deleted', async () => {
      const photo = await prisma.recipePhoto.create({
        data: {
          recipeId,
          s3Url: 'https://s3.amazonaws.com/bucket/photo3.jpg',
          thumbnailUrl: 'https://s3.amazonaws.com/bucket/photo3_thumb.jpg',
          fileSize: 256000,
          width: 800,
          height: 600,
        },
      });

      await prisma.recipe.delete({ where: { id: recipeId } });

      const deleted = await prisma.recipePhoto.findUnique({
        where: { id: photo.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('Seed Data', () => {
    it('should have seeded ingredients in database', async () => {
      const count = await prisma.ingredient.count();
      expect(count).toBeGreaterThanOrEqual(500); // AC: 500-1000 ingredients
      expect(count).toBeLessThanOrEqual(1000);
    });

    it('should have all 9 categories represented', async () => {
      const categories = await prisma.ingredient.groupBy({
        by: ['category'],
        _count: true,
      });

      const categoryNames = categories.map((c) => c.category);
      expect(categoryNames).toContain('Produce');
      expect(categoryNames).toContain('Meat/Seafood');
      expect(categoryNames).toContain('Dairy');
      expect(categoryNames).toContain('Bakery');
      expect(categoryNames).toContain('Canned Goods');
      expect(categoryNames).toContain('Frozen');
      expect(categoryNames).toContain('Spices');
      expect(categoryNames).toContain('Pantry');
      expect(categoryNames).toContain('Other');
    });

    it('should have commonUnits populated for sample ingredients', async () => {
      const ingredient = await prisma.ingredient.findFirst({
        where: {
          name: 'Tomato',
        },
      });

      expect(ingredient).toBeDefined();
      expect(ingredient?.commonUnits).toBeDefined();
      expect(ingredient?.commonUnits.length).toBeGreaterThan(0);
    });
  });
});
