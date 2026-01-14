import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';

describe('Adjust Recipe Portions (e2e)', () => {
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
        email: 'test-adjust-portions@example.com',
        firstName: 'Test',
        passwordHash: null,
      },
    });
    userId = user.id;

    // Create another test user
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-adjust-portions@example.com',
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

    // Create a test recipe with various ingredient types
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: 'Test Recipe for Portion Adjustment',
        description: 'A recipe with various ingredient types',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        ingredients: {
          create: [
            {
              ingredientName: 'Flour',
              quantity: 2,
              unit: 'cups',
              notes: null,
              sortOrder: 1,
            },
            {
              ingredientName: 'Sugar',
              quantity: 2,
              unit: 'tbsp',
              notes: null,
              sortOrder: 2,
            },
            {
              ingredientName: 'Salt',
              quantity: 1,
              unit: 'pinch',
              notes: null,
              sortOrder: 3,
            },
            {
              ingredientName: 'Vanilla',
              quantity: 1,
              unit: 'tsp',
              notes: null,
              sortOrder: 4,
            },
            {
              ingredientName: 'Pepper',
              quantity: 0,
              unit: 'to taste',
              notes: null,
              sortOrder: 5,
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
        ingredients: {
          create: [
            {
              ingredientName: 'Water',
              quantity: 1,
              unit: 'cup',
              notes: null,
              sortOrder: 1,
            },
          ],
        },
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
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-adjust-portions@example.com',
            'other-adjust-portions@example.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('GET /api/recipes/:id/adjust-portions', () => {
    it('should return 200 with adjusted ingredient quantities (multiplier=2)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=2`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(recipeId);
      expect(response.body.userId).toBe(userId);
      expect(response.body.title).toBe('Test Recipe for Portion Adjustment');
      expect(response.body.originalServings).toBe(4);

      // Verify scalable ingredients are multiplied
      const flour = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );
      expect(flour.quantity).toBe(4); // 2 cups × 2 = 4 cups
      expect(flour.unit).toBe('cups');
      expect(flour.isScalable).toBe(true);

      const sugar = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Sugar',
      );
      expect(sugar.quantity).toBe(4); // 2 tbsp × 2 = 4 tbsp
      expect(sugar.unit).toBe('tbsp');
      expect(sugar.isScalable).toBe(true);

      // Verify non-scalable ingredients are unchanged
      const salt = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Salt',
      );
      expect(salt.quantity).toBe(1); // pinch not multiplied
      expect(salt.unit).toBe('pinch');
      expect(salt.isScalable).toBe(false);

      const pepper = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Pepper',
      );
      expect(pepper.quantity).toBe(0);
      expect(pepper.unit).toBe('to taste');
      expect(pepper.isScalable).toBe(false);
    });

    it('should apply unit conversion when threshold reached (2 tbsp × 8 = 1 cup)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=8`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const sugar = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Sugar',
      );
      expect(sugar.quantity).toBe(1); // 2 tbsp × 8 = 16 tbsp = 1 cup
      expect(sugar.unit).toBe('cup');
      expect(sugar.displayQuantity).toBe('1 cup');
    });

    it('should display fractions for common decimals (multiplier=0.5)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=0.5`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const flour = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );
      expect(flour.quantity).toBe(1); // 2 cups × 0.5 = 1 cup
      expect(flour.displayQuantity).toBe('1 cups');

      const vanilla = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Vanilla',
      );
      expect(vanilla.quantity).toBe(0.5); // 1 tsp × 0.5 = 0.5 tsp
      expect(vanilla.displayQuantity).toBe('1/2 tsp');
    });

    it('should handle unusual multipliers (0.25)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=0.25`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const flour = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );
      expect(flour.quantity).toBe(0.5); // 2 cups × 0.25 = 0.5 cups
      expect(flour.displayQuantity).toBe('1/2 cups');
    });

    it('should handle large multipliers (multiplier=10)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=10`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const flour = response.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );
      expect(flour.quantity).toBe(20); // 2 cups × 10 = 20 cups
      expect(flour.displayQuantity).toBe('20 cups');
    });

    it('should not save adjusted portions to database (verification)', async () => {
      // Adjust portions
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=2`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Fetch original recipe to verify no changes
      const originalResponse = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const flour = originalResponse.body.ingredients.find(
        (ing: any) => ing.ingredientName === 'Flour',
      );
      expect(flour.quantity).toBe(2); // Original quantity unchanged
      expect(originalResponse.body.servings).toBe(4); // Original servings unchanged
    });

    it('should return 401 Unauthorized without JWT token', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=2`)
        .expect(401);
    });

    it('should return 404 Not Found when user does not own recipe (security)', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${otherRecipeId}/adjust-portions?multiplier=2`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 Not Found when recipe does not exist', async () => {
      const nonExistentRecipeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(
          `/api/recipes/${nonExistentRecipeId}/adjust-portions?multiplier=2`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 Bad Request for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes/invalid-uuid/adjust-portions?multiplier=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier is missing', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier is zero', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=0`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier is negative', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=-1`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier is not a number', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=invalid`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier exceeds maximum (>100)', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=101`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when multiplier is below minimum (<0.01)', async () => {
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}/adjust-portions?multiplier=0.001`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
