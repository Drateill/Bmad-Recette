import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('PUT /api/recipes/:id (e2e)', () => {
  let app: any; // INestApplication type conflict between root and workspace node_modules
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let testRecipeId: string;
  let otherUserToken: string;
  let tagId1: string;
  let tagId2: string;
  let tagId3: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(ThrottlerModule)
      .useModule(
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10000,
          },
        ]),
      )
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up test data
    await prisma.recipeTag.deleteMany({});
    await prisma.recipeStep.deleteMany({});
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipePhoto.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.tagCategory.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-update@example.com', 'other-update@example.com'],
        },
      },
    });

    // Register and login main test user
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test-update@example.com',
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-update@example.com',
        password: 'Test1234',
      });

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Register and login other user for authorization testing
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'other-update@example.com',
        password: 'Test1234',
        firstName: 'Other',
        lastName: 'User',
      });

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'other-update@example.com',
        password: 'Test1234',
      });

    otherUserToken = otherLoginResponse.body.accessToken;

    // Create tag categories and tags for testing
    const tagCategory1 = await prisma.tagCategory.create({
      data: { name: 'Time', slug: 'time', sortOrder: 1 },
    });

    const tagCategory2 = await prisma.tagCategory.create({
      data: { name: 'Difficulty', slug: 'difficulty', sortOrder: 2 },
    });

    const tag1 = await prisma.tag.create({
      data: {
        name: 'Quick',
        slug: 'quick',
        color: '#00FF00',
        categoryId: tagCategory1.id,
      },
    });
    tagId1 = tag1.id;

    const tag2 = await prisma.tag.create({
      data: {
        name: 'Easy',
        slug: 'easy',
        color: '#0000FF',
        categoryId: tagCategory2.id,
      },
    });
    tagId2 = tag2.id;

    const tag3 = await prisma.tag.create({
      data: {
        name: 'Healthy',
        slug: 'healthy',
        color: '#FF0000',
        categoryId: tagCategory2.id,
      },
    });
    tagId3 = tag3.id;
  });

  beforeEach(async () => {
    // Clean up recipes before each test
    await prisma.recipeTag.deleteMany({});
    await prisma.recipeStep.deleteMany({});
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipePhoto.deleteMany({});
    await prisma.recipe.deleteMany({});

    // Create a fresh test recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: 'Original Recipe',
        description: 'Original description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
      },
    });
    testRecipeId = recipe.id;

    // Add ingredients
    await prisma.recipeIngredient.createMany({
      data: [
        {
          recipeId: testRecipeId,
          ingredientName: 'Flour',
          quantity: 2,
          unit: 'cups',
          sortOrder: 1,
        },
        {
          recipeId: testRecipeId,
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          sortOrder: 2,
        },
      ],
    });

    // Add steps
    await prisma.recipeStep.createMany({
      data: [
        {
          recipeId: testRecipeId,
          stepNumber: 1,
          instruction: 'Mix dry ingredients',
        },
        {
          recipeId: testRecipeId,
          stepNumber: 2,
          instruction: 'Bake for 30 minutes',
          duration: 30,
        },
      ],
    });

    // Add tags
    await prisma.recipeTag.createMany({
      data: [
        { recipeId: testRecipeId, tagId: tagId1 },
        { recipeId: testRecipeId, tagId: tagId2 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.recipeTag.deleteMany({});
    await prisma.recipeStep.deleteMany({});
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipePhoto.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.tagCategory.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-update@example.com', 'other-update@example.com'],
        },
      },
    });
    await app.close();
  });

  describe('successful updates', () => {
    it('should update recipe and return 200 with updated data', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Recipe Title',
          description: 'Updated description',
          prepTime: 15,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: testRecipeId,
        title: 'Updated Recipe Title',
        description: 'Updated description',
        prepTime: 15,
        cookTime: 20, // Unchanged
        servings: 4, // Unchanged
        version: 2, // Incremented
      });

      // Verify database was updated
      const dbRecipe = await prisma.recipe.findUnique({
        where: { id: testRecipeId },
      });
      expect(dbRecipe?.title).toBe('Updated Recipe Title');
      expect(dbRecipe?.version).toBe(2);
    });

    it('should support partial update - only title changed', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Only Title Changed',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Only Title Changed',
        description: 'Original description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
      });
    });

    it('should update full recipe with all fields', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complete Update',
          description: 'Fully updated',
          prepTime: 5,
          cookTime: 15,
          servings: 2,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Complete Update',
        description: 'Fully updated',
        prepTime: 5,
        cookTime: 15,
        servings: 2,
      });
    });
  });

  describe('ingredients replacement', () => {
    it('should replace ingredients array completely', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredients: [
            {
              quantity: 3,
              unit: 'cups',
              ingredientName: 'Rice',
            },
            {
              quantity: 2,
              unit: 'tbsp',
              ingredientName: 'Butter',
            },
          ],
        })
        .expect(200);

      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.ingredients[0].ingredientName).toBe('Rice');
      expect(response.body.ingredients[1].ingredientName).toBe('Butter');

      // Verify old ingredients deleted
      const dbIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId: testRecipeId },
      });
      expect(dbIngredients).toHaveLength(2);
      expect(dbIngredients.find((i) => i.ingredientName === 'Flour')).toBeUndefined();
    });

    it('should auto-assign sortOrder if not provided', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredients: [
            { quantity: 1, unit: 'cup', ingredientName: 'A' },
            { quantity: 2, unit: 'cup', ingredientName: 'B' },
            { quantity: 3, unit: 'cup', ingredientName: 'C' },
          ],
        })
        .expect(200);

      expect(response.body.ingredients[0].sortOrder).toBe(1);
      expect(response.body.ingredients[1].sortOrder).toBe(2);
      expect(response.body.ingredients[2].sortOrder).toBe(3);
    });

    it('should allow empty ingredients array', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredients: [],
        })
        .expect(200);

      expect(response.body.ingredients).toHaveLength(0);

      const dbIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId: testRecipeId },
      });
      expect(dbIngredients).toHaveLength(0);
    });
  });

  describe('steps replacement', () => {
    it('should replace steps array completely', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            { instruction: 'New step 1' },
            { instruction: 'New step 2', duration: 15 },
            { instruction: 'New step 3' },
          ],
        })
        .expect(200);

      expect(response.body.steps).toHaveLength(3);
      expect(response.body.steps[0].instruction).toBe('New step 1');
      expect(response.body.steps[1].instruction).toBe('New step 2');
      expect(response.body.steps[2].instruction).toBe('New step 3');

      // Verify old steps deleted
      const dbSteps = await prisma.recipeStep.findMany({
        where: { recipeId: testRecipeId },
      });
      expect(dbSteps).toHaveLength(3);
      expect(dbSteps.find((s) => s.instruction === 'Mix dry ingredients')).toBeUndefined();
    });

    it('should auto-assign stepNumber if not provided', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          steps: [
            { instruction: 'First' },
            { instruction: 'Second' },
          ],
        })
        .expect(200);

      expect(response.body.steps[0].stepNumber).toBe(1);
      expect(response.body.steps[1].stepNumber).toBe(2);
    });
  });

  describe('tags upsert', () => {
    it('should update tags using upsert logic', async () => {
      // Original tags: tagId1, tagId2
      // New tags: tagId2, tagId3
      // Expected: tagId1 removed, tagId3 added, tagId2 unchanged

      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tagIds: [tagId2, tagId3],
        })
        .expect(200);

      expect(response.body.tags).toHaveLength(2);
      const tagIds = response.body.tags.map((t: any) => t.id);
      expect(tagIds).toContain(tagId2);
      expect(tagIds).toContain(tagId3);
      expect(tagIds).not.toContain(tagId1);

      // Verify database
      const dbTags = await prisma.recipeTag.findMany({
        where: { recipeId: testRecipeId },
      });
      expect(dbTags).toHaveLength(2);
    });

    it('should handle empty tagIds array', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tagIds: [],
        })
        .expect(200);

      expect(response.body.tags).toHaveLength(0);

      const dbTags = await prisma.recipeTag.findMany({
        where: { recipeId: testRecipeId },
      });
      expect(dbTags).toHaveLength(0);
    });
  });

  describe('optimistic locking', () => {
    it('should detect concurrent modifications and return 409 Conflict', async () => {
      // Fetch current version
      const recipe = await prisma.recipe.findUnique({
        where: { id: testRecipeId },
      });

      // Simulate User A updates (version becomes 2)
      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'User A Update',
          expectedVersion: recipe!.version,
        })
        .expect(200);

      // User B tries to update with stale version (still expects version 1)
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'User B Update',
          expectedVersion: recipe!.version, // Stale version
        })
        .expect(409);

      expect(response.body.message).toContain(
        'Recipe was modified by another user',
      );
    });

    it('should succeed when expectedVersion matches', async () => {
      const recipe = await prisma.recipe.findUnique({
        where: { id: testRecipeId },
      });

      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Update',
          expectedVersion: recipe!.version,
        })
        .expect(200);
    });

    it('should update without version check when expectedVersion not provided', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Without Version Check',
        })
        .expect(200);
    });
  });

  describe('authorization', () => {
    it('should return 401 Unauthorized without JWT', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(401);
    });

    it('should return 403 Forbidden when user does not own recipe', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Hacker Update',
        })
        .expect(403);

      expect(response.body.message).toContain('You do not own this recipe');
    });
  });

  describe('error handling', () => {
    it('should return 404 when recipe does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/recipes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Nonexistent',
        })
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .put('/api/recipes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update',
        })
        .expect(400);
    });

    it('should return 400 for invalid input validation', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prepTime: -10, // Invalid: negative time
        })
        .expect(400);
    });

    it('should return 400 for invalid servings', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          servings: 0, // Invalid: must be at least 1
        })
        .expect(400);
    });

    it('should return 400 for invalid tag IDs', async () => {
      const fakeTagId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tagIds: [fakeTagId],
        })
        .expect(400);
    });
  });

  describe('updatedAt timestamp', () => {
    it('should update updatedAt timestamp on update', async () => {
      const originalRecipe = await prisma.recipe.findUnique({
        where: { id: testRecipeId },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${testRecipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        originalRecipe!.updatedAt.getTime(),
      );
    });
  });
});
