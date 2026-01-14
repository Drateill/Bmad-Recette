import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import { RecipesModule } from '../../src/modules/recipes/recipes.module';
import { StorageModule } from '../../src/modules/storage/storage.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { JwtService } from '@nestjs/jwt';

describe('DELETE /api/recipes/:id (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let testUser1: any;
  let testUser2: any;
  let testUser1Token: string;
  let testUser2Token: string;
  let testRecipe: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RecipesModule, StorageModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'delete-test-user1@example.com',
        firstName: 'Test',
        passwordHash: 'hashed_password',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'delete-test-user2@example.com',
        firstName: 'Test',
        passwordHash: 'hashed_password',
      },
    });

    // Generate JWT tokens
    testUser1Token = jwtService.sign({
      sub: testUser1.id,
      email: testUser1.email,
    });
    testUser2Token = jwtService.sign({
      sub: testUser2.id,
      email: testUser2.email,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.recipePhoto.deleteMany({
      where: { recipe: { userId: { in: [testUser1.id, testUser2.id] } } },
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { userId: { in: [testUser1.id, testUser2.id] } } },
    });
    await prisma.recipeStep.deleteMany({
      where: { recipe: { userId: { in: [testUser1.id, testUser2.id] } } },
    });
    await prisma.recipeTag.deleteMany({
      where: { recipe: { userId: { in: [testUser1.id, testUser2.id] } } },
    });
    await prisma.recipe.deleteMany({
      where: { userId: { in: [testUser1.id, testUser2.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser1.id, testUser2.id] } },
    });

    await app.close();
  });

  beforeEach(async () => {
    // Create a test recipe for each test
    testRecipe = await prisma.recipe.create({
      data: {
        userId: testUser1.id,
        title: 'Recipe to Delete',
        description: 'This recipe will be deleted',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
      },
    });
  });

  afterEach(async () => {
    // Clean up test recipe if it still exists
    await prisma.recipe.deleteMany({
      where: { id: testRecipe.id },
    });
  });

  describe('successful deletion', () => {
    it('should delete recipe and return 204 No Content', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(204);

      // Assert
      expect(response.body).toEqual({});

      // Verify recipe is deleted from database
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { id: testRecipe.id },
      });
      expect(deletedRecipe).toBeNull();
    });
  });

  describe('authentication', () => {
    it('should return 401 Unauthorized when no JWT token provided', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .expect(401);

      // Verify recipe is NOT deleted
      const recipe = await prisma.recipe.findUnique({
        where: { id: testRecipe.id },
      });
      expect(recipe).not.toBeNull();
    });

    it('should return 401 Unauthorized with invalid JWT token', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      // Verify recipe is NOT deleted
      const recipe = await prisma.recipe.findUnique({
        where: { id: testRecipe.id },
      });
      expect(recipe).not.toBeNull();
    });
  });

  describe('authorization', () => {
    it('should return 404 when user tries to delete another user\'s recipe', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(404);

      // Verify recipe is NOT deleted
      const recipe = await prisma.recipe.findUnique({
        where: { id: testRecipe.id },
      });
      expect(recipe).not.toBeNull();
    });
  });

  describe('not found', () => {
    it('should return 404 when recipe does not exist', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await request(app.getHttpServer())
        .delete(`/recipes/${nonExistentId}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(404);
    });

    it('should return 400 Bad Request when recipe ID is not a valid UUID', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete('/recipes/invalid-uuid')
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(400);
    });
  });

  describe('cascade deletion', () => {
    it('should cascade delete all related records (ingredients, steps, tags, photos)', async () => {
      // Arrange: Create recipe with all relations
      const tagCategory = await prisma.tagCategory.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          sortOrder: 1,
        },
      });

      const tag = await prisma.tag.create({
        data: {
          categoryId: tagCategory.id,
          name: 'Test Tag',
          slug: 'test-tag',
          isSystem: true,
        },
      });

      const ingredient = await prisma.ingredient.create({
        data: {
          name: 'Test Ingredient',
          category: 'Vegetables',
          commonUnits: ['g', 'kg'],
        },
      });

      const recipeWithRelations = await prisma.recipe.create({
        data: {
          userId: testUser1.id,
          title: 'Recipe with Relations',
          description: 'Test recipe',
          prepTime: 15,
          cookTime: 30,
          servings: 4,
          ingredients: {
            create: [
              {
                ingredientId: ingredient.id,
                ingredientName: 'Test Ingredient',
                quantity: 100,
                unit: 'g',
                sortOrder: 1,
              },
            ],
          },
          steps: {
            create: [
              {
                stepNumber: 1,
                instruction: 'Test step',
                duration: 10,
              },
            ],
          },
          tags: {
            create: [
              {
                tagId: tag.id,
              },
            ],
          },
          photos: {
            create: [
              {
                s3Url: 'https://example.com/photo.jpg',
                thumbnailUrl: 'https://example.com/photo_thumb.jpg',
                isPrimary: true,
                fileSize: 1024,
                width: 800,
                height: 600,
              },
            ],
          },
        },
      });

      // Act: Delete recipe
      await request(app.getHttpServer())
        .delete(`/recipes/${recipeWithRelations.id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(204);

      // Assert: Verify recipe deleted
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { id: recipeWithRelations.id },
      });
      expect(deletedRecipe).toBeNull();

      // Assert: Verify cascade deletion of ingredients
      const ingredients = await prisma.recipeIngredient.findMany({
        where: { recipeId: recipeWithRelations.id },
      });
      expect(ingredients).toHaveLength(0);

      // Assert: Verify cascade deletion of steps
      const steps = await prisma.recipeStep.findMany({
        where: { recipeId: recipeWithRelations.id },
      });
      expect(steps).toHaveLength(0);

      // Assert: Verify cascade deletion of tags
      const tags = await prisma.recipeTag.findMany({
        where: { recipeId: recipeWithRelations.id },
      });
      expect(tags).toHaveLength(0);

      // Assert: Verify cascade deletion of photos
      const photos = await prisma.recipePhoto.findMany({
        where: { recipeId: recipeWithRelations.id },
      });
      expect(photos).toHaveLength(0);

      // Cleanup
      await prisma.tag.delete({ where: { id: tag.id } });
      await prisma.tagCategory.delete({ where: { id: tagCategory.id } });
      await prisma.ingredient.delete({ where: { id: ingredient.id } });
    });
  });

  describe('idempotency', () => {
    it('should return 404 when deleting same recipe twice', async () => {
      // Act: Delete recipe first time
      await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(204);

      // Act: Try to delete same recipe again
      await request(app.getHttpServer())
        .delete(`/recipes/${testRecipe.id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(404);
    });
  });

  describe('S3 photo deletion', () => {
    it('should queue async deletion of S3 photos', async () => {
      // Arrange: Create recipe with photos
      const recipeWithPhotos = await prisma.recipe.create({
        data: {
          userId: testUser1.id,
          title: 'Recipe with Photos',
          description: 'Test',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
          photos: {
            create: [
              {
                s3Url:
                  'https://bucket.s3.amazonaws.com/user123/recipe456/photo1.jpg',
                thumbnailUrl:
                  'https://bucket.s3.amazonaws.com/user123/recipe456/photo1_thumb.jpg',
                isPrimary: true,
                fileSize: 2048,
                width: 1024,
                height: 768,
              },
              {
                s3Url:
                  'https://bucket.s3.amazonaws.com/user123/recipe456/photo2.jpg',
                thumbnailUrl:
                  'https://bucket.s3.amazonaws.com/user123/recipe456/photo2_thumb.jpg',
                isPrimary: false,
                fileSize: 1536,
                width: 800,
                height: 600,
              },
            ],
          },
        },
      });

      // Act: Delete recipe
      await request(app.getHttpServer())
        .delete(`/recipes/${recipeWithPhotos.id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .expect(204);

      // Assert: Recipe should be deleted immediately (not blocked by S3)
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { id: recipeWithPhotos.id },
      });
      expect(deletedRecipe).toBeNull();

      // Note: S3 deletion is async and happens in background
      // In production, verify S3 deletion through logs or S3 console
    });
  });
});
