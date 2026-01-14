import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';

describe('Get Recipe Details (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let recipeId: string;
  let otherUserId: string;
  let otherRecipeId: string;
  let tagId: string;

  beforeAll(async () => {
    const mockGoogleStrategy = {
      validate: jest.fn(),
    };
    const mockAppleStrategy = {
      validate: jest.fn(),
    };

    // Mock ThrottlerGuard to disable rate limiting in tests
    const mockThrottlerGuard = {
      canActivate: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(ThrottlerModule)
      .useModule(
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10000, // Very high limit for testing
          },
        ]),
      )
      .overrideProvider(GoogleStrategy)
      .useValue(mockGoogleStrategy)
      .overrideProvider(AppleStrategy)
      .useValue(mockAppleStrategy)
      .overrideGuard(ThrottlerGuard)
      .useValue(mockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-get-recipe@example.com',
        firstName: 'Test',
        passwordHash: null,
      },
    });
    userId = user.id;

    // Create another test user
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-get-recipe@example.com',
        firstName: 'Other',
        passwordHash: null,
      },
    });
    otherUserId = otherUser.id;

    // Create tag category and tag for testing
    const tagCategory = await prisma.tagCategory.create({
      data: {
        name: 'Dietary',
        slug: 'dietary',
        sortOrder: 1,
      },
    });

    const tag = await prisma.tag.create({
      data: {
        categoryId: tagCategory.id,
        name: 'Vegetarian',
        slug: 'vegetarian',
        isSystem: true,
        userId: null,
        color: '#00FF00',
      },
    });
    tagId = tag.id;

    // Create ingredient catalog entry
    await prisma.ingredient.create({
      data: {
        name: 'Flour',
        category: 'Baking',
        commonUnits: ['cup', 'tbsp', 'g'],
      },
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/dev-login')
      .send({ email: user.email })
      .expect(200);

    accessToken = loginResponse.body.accessToken;

    // Create a test recipe with all relations
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: 'Test Recipe for Get Details',
        description: 'A comprehensive test recipe',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        rating: 5,
        source: 'https://example.com/recipe',
        ingredients: {
          create: [
            {
              ingredientName: 'Flour',
              quantity: 2,
              unit: 'cups',
              notes: 'All-purpose flour',
              sortOrder: 1,
              ingredient: {
                connect: {
                  name: 'Flour',
                },
              },
            },
            {
              ingredientName: 'Custom Ingredient',
              quantity: 1,
              unit: 'piece',
              notes: null,
              sortOrder: 2,
            },
          ],
        },
        steps: {
          create: [
            {
              stepNumber: 1,
              instruction: 'Mix flour with water',
              duration: 5,
            },
            {
              stepNumber: 2,
              instruction: 'Knead the dough',
              duration: 10,
            },
            {
              stepNumber: 3,
              instruction: 'Bake at 350F',
              duration: 30,
            },
          ],
        },
        tags: {
          create: [
            {
              tagId: tagId,
            },
          ],
        },
        photos: {
          create: [
            {
              s3Url: 'https://s3.example.com/photo1.jpg',
              thumbnailUrl: 'https://s3.example.com/photo1-thumb.jpg',
              isPrimary: true,
              fileSize: 1024000,
              width: 1920,
              height: 1080,
            },
            {
              s3Url: 'https://s3.example.com/photo2.jpg',
              thumbnailUrl: 'https://s3.example.com/photo2-thumb.jpg',
              isPrimary: false,
              fileSize: 512000,
              width: 1280,
              height: 720,
            },
          ],
        },
      },
    });
    recipeId = recipe.id;

    // Create a recipe for the other user
    const otherRecipe = await prisma.recipe.create({
      data: {
        userId: otherUserId,
        title: 'Other User Recipe',
        description: null,
        prepTime: 10,
        cookTime: 20,
        servings: 2,
      },
    });
    otherRecipeId = otherRecipe.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.recipe.deleteMany({
      where: {
        userId: {
          in: [userId, otherUserId],
        },
      },
    });
    await prisma.tag.delete({ where: { id: tagId } });
    await prisma.tagCategory.deleteMany({ where: { slug: 'dietary' } });
    await prisma.ingredient.delete({ where: { name: 'Flour' } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-get-recipe@example.com', 'other-get-recipe@example.com'],
        },
      },
    });
    await app.close();
  });

  describe('GET /api/recipes/:id', () => {
    it('should return 200 with complete recipe object', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: recipeId,
        userId: userId,
        title: 'Test Recipe for Get Details',
        description: 'A comprehensive test recipe',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        rating: 5,
        source: 'https://example.com/recipe',
        version: 1,
        totalTime: 45, // 15 + 30
        ingredientCount: 2,
        stepCount: 3,
      });

      // Verify nested relations are present
      expect(response.body.ingredients).toHaveLength(2);
      expect(response.body.steps).toHaveLength(3);
      expect(response.body.tags).toHaveLength(1);
      expect(response.body.photos).toHaveLength(2);
    });

    it('should include ingredient catalog reference when linked', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const flourIngredient = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );

      expect(flourIngredient).toBeDefined();
      expect(flourIngredient.ingredient).toMatchObject({
        name: 'Flour',
        category: 'Baking',
        commonUnits: ['cup', 'tbsp', 'g'],
      });
    });

    it('should handle ingredients without catalog reference', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const customIngredient = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Custom Ingredient',
      );

      expect(customIngredient).toBeDefined();
      expect(customIngredient.ingredient).toBeNull();
    });

    it('should return ingredients ordered by sortOrder ASC', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.ingredients[0].sortOrder).toBe(1);
      expect(response.body.ingredients[1].sortOrder).toBe(2);
    });

    it('should return steps ordered by stepNumber ASC', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.steps[0].stepNumber).toBe(1);
      expect(response.body.steps[1].stepNumber).toBe(2);
      expect(response.body.steps[2].stepNumber).toBe(3);
    });

    it('should return photos ordered by isPrimary DESC (primary first)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.photos[0].isPrimary).toBe(true);
      expect(response.body.photos[1].isPrimary).toBe(false);
    });

    it('should include tags with category information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.tags[0]).toMatchObject({
        name: 'Vegetarian',
        slug: 'vegetarian',
        color: '#00FF00',
        category: {
          name: 'Dietary',
          slug: 'dietary',
        },
      });
    });

    it('should return computed field totalTime = prepTime + cookTime', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.totalTime).toBe(45);
    });

    it('should return computed field ingredientCount', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.ingredientCount).toBe(2);
    });

    it('should return computed field stepCount', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.stepCount).toBe(3);
    });

    it('should return 401 Unauthorized without JWT token', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .expect(401);
    });

    it('should return 404 Not Found when user does not own recipe (security: prevent enumeration)', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${otherRecipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 Not Found when recipe does not exist', async () => {
      const nonExistentRecipeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/recipes/${nonExistentRecipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 Bad Request for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
