import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';

describe('Recipe Rating (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let recipeId: string;
  let otherUserId: string;
  let otherRecipeId: string;

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
        email: 'test-rating@example.com',
        firstName: 'Test',
        passwordHash: null,
      },
    });
    userId = user.id;

    // Create another test user
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-rating@example.com',
        firstName: 'Other',
        passwordHash: null,
      },
    });
    otherUserId = otherUser.id;

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/dev-login')
      .send({ email: user.email })
      .expect(200);

    accessToken = loginResponse.body.accessToken;

    // Create test recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: 'Test Recipe',
        description: 'Test description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
      },
    });
    recipeId = recipe.id;

    // Create recipe for other user
    const otherRecipe = await prisma.recipe.create({
      data: {
        userId: otherUserId,
        title: 'Other Recipe',
        description: 'Other description',
        prepTime: 15,
        cookTime: 25,
        servings: 2,
      },
    });
    otherRecipeId = otherRecipe.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.recipe.deleteMany({
      where: {
        userId: { in: [userId, otherUserId] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-rating@example.com', 'other-rating@example.com'] },
      },
    });

    await app.close();
  });

  describe('PUT /api/recipes/:id/rating', () => {
    it('should update recipe rating to 5', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 5 })
        .expect(200);

      expect(response.body.rating).toBe(5);
      expect(response.body.id).toBe(recipeId);

      // Verify in database
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
      });
      expect(recipe?.rating).toBe(5);
    });

    it('should update recipe rating to 1', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 1 })
        .expect(200);

      expect(response.body.rating).toBe(1);
    });

    it('should update recipe rating to 3', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 3 })
        .expect(200);

      expect(response.body.rating).toBe(3);
    });

    it('should clear recipe rating (set to null)', async () => {
      // First set a rating
      await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 4 })
        .expect(200);

      // Then clear it
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: null })
        .expect(200);

      expect(response.body.rating).toBeNull();

      // Verify in database
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
      });
      expect(recipe?.rating).toBeNull();
    });

    it('should return 400 for rating below 1', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 0 })
        .expect(400);
    });

    it('should return 400 for rating above 5', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 6 })
        .expect(400);
    });

    it('should return 400 for non-integer rating', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 3.5 })
        .expect(400);
    });

    it('should return 403 when trying to rate another user\'s recipe', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${otherRecipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 5 })
        .expect(403);
    });

    it('should return 404 for non-existent recipe', async () => {
      const fakeRecipeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .put(`/api/recipes/${fakeRecipeId}/rating`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 5 })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/rating`)
        .send({ rating: 5 })
        .expect(401);
    });
  });

  describe('GET /api/recipes with minRating filter', () => {
    beforeAll(async () => {
      // Create multiple recipes with different ratings
      await prisma.recipe.create({
        data: {
          userId,
          title: 'Five Star Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          rating: 5,
        },
      });

      await prisma.recipe.create({
        data: {
          userId,
          title: 'Four Star Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          rating: 4,
        },
      });

      await prisma.recipe.create({
        data: {
          userId,
          title: 'Three Star Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          rating: 3,
        },
      });

      await prisma.recipe.create({
        data: {
          userId,
          title: 'Two Star Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          rating: 2,
        },
      });

      await prisma.recipe.create({
        data: {
          userId,
          title: 'Unrated Recipe',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          rating: null,
        },
      });
    });

    it('should filter recipes with minRating=4 (returns 4 and 5 star recipes)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .query({ minRating: 4 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const ratings = response.body.data.map((r: any) => r.rating);

      // All returned recipes should have rating >= 4
      ratings.forEach((rating: number) => {
        expect(rating).toBeGreaterThanOrEqual(4);
      });

      // Should have at least 2 recipes (4 and 5 star)
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter recipes with minRating=5 (returns only 5 star recipes)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .query({ minRating: 5 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const ratings = response.body.data.map((r: any) => r.rating);

      // All returned recipes should have rating = 5
      ratings.forEach((rating: number) => {
        expect(rating).toBe(5);
      });

      // Should have at least 1 recipe
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter recipes with minRating=1 (returns all rated recipes)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .query({ minRating: 1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();

      // Should return all rated recipes (excluding unrated ones)
      const ratings = response.body.data.map((r: any) => r.rating);
      ratings.forEach((rating: number | null) => {
        if (rating !== null) {
          expect(rating).toBeGreaterThanOrEqual(1);
        }
      });
    });

    it('should return 400 for invalid minRating (below 1)', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes')
        .query({ minRating: 0 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 for invalid minRating (above 5)', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes')
        .query({ minRating: 6 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
