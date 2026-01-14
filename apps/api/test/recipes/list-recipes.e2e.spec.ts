import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';

describe('List Recipes (e2e)', () => {
  let app: any; // Using 'any' to avoid NestJS type version conflicts
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let tag1Id: string;
  let tag2Id: string;

  beforeAll(async () => {
    const mockGoogleStrategy = {
      validate: jest.fn(),
    };
    const mockAppleStrategy = {
      validate: jest.fn(),
    };

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
            limit: 10000,
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
        email: 'test-list-recipes@example.com',
        firstName: 'Test',
        passwordHash: null,
      },
    });
    userId = user.id;

    // Create tag category and tags
    const tagCategory = await prisma.tagCategory.create({
      data: {
        name: 'Dietary',
        slug: 'dietary-list-test',
        sortOrder: 1,
      },
    });

    const tag1 = await prisma.tag.create({
      data: {
        categoryId: tagCategory.id,
        name: 'Vegetarian',
        slug: 'vegetarian-list-test',
        isSystem: true,
      },
    });
    tag1Id = tag1.id;

    const tag2 = await prisma.tag.create({
      data: {
        categoryId: tagCategory.id,
        name: 'Quick',
        slug: 'quick-list-test',
        isSystem: true,
      },
    });
    tag2Id = tag2.id;

    // Create test recipes
    const recipe1 = await prisma.recipe.create({
      data: {
        userId,
        title: 'Chicken Stir Fry',
        description: 'Quick and easy chicken recipe',
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        rating: 5,
      },
    });

    // Add tag to recipe1
    await prisma.recipeTag.create({
      data: {
        recipeId: recipe1.id,
        tagId: tag2Id,
      },
    });

    const recipe2 = await prisma.recipe.create({
      data: {
        userId,
        title: 'Vegetarian Pasta',
        description: 'Delicious veggie pasta',
        prepTime: 20,
        cookTime: 25,
        servings: 2,
        rating: 4,
      },
    });

    // Add tags to recipe2
    await prisma.recipeTag.createMany({
      data: [
        { recipeId: recipe2.id, tagId: tag1Id },
        { recipeId: recipe2.id, tagId: tag2Id },
      ],
    });

    const recipe3 = await prisma.recipe.create({
      data: {
        userId,
        title: 'Slow Cooked Beef',
        description: 'Tender beef stew',
        prepTime: 30,
        cookTime: 180, // 3 hours
        servings: 6,
        rating: 5,
      },
    });

    // Add tag to recipe3
    await prisma.recipeTag.create({
      data: {
        recipeId: recipe3.id,
        tagId: tag1Id,
      },
    });

    // Create recipe with ingredients for search testing
    const recipe4 = await prisma.recipe.create({
      data: {
        userId,
        title: 'Lemon Cake',
        description: 'Sweet dessert',
        prepTime: 15,
        cookTime: 40,
        servings: 8,
        rating: null,
      },
    });

    await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe4.id,
        ingredientName: 'chicken broth',
        quantity: 2,
        unit: 'cups',
        sortOrder: 1,
      },
    });

    // Get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/test-login')
      .send({ email: user.email })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.recipeTag.deleteMany({
      where: { recipe: { userId } },
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipe: { userId } },
    });
    await prisma.recipe.deleteMany({ where: { userId } });
    await prisma.tag.deleteMany({
      where: { slug: { in: ['vegetarian-list-test', 'quick-list-test'] } },
    });
    await prisma.tagCategory.deleteMany({
      where: { slug: 'dietary-list-test' },
    });
    await prisma.user.deleteMany({
      where: { email: 'test-list-recipes@example.com' },
    });

    await app.close();
  });

  describe('GET /api/recipes', () => {
    it('should return list of recipes with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/api/recipes').expect(401);
    });

    it('should return recipes with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const firstRecipe = response.body.data[0];
      expect(firstRecipe).toHaveProperty('id');
      expect(firstRecipe).toHaveProperty('title');
      expect(firstRecipe).toHaveProperty('description');
      expect(firstRecipe).toHaveProperty('prepTime');
      expect(firstRecipe).toHaveProperty('cookTime');
      expect(firstRecipe).toHaveProperty('servings');
      expect(firstRecipe).toHaveProperty('totalTime');
      expect(firstRecipe).toHaveProperty('tagIds');
      expect(firstRecipe.totalTime).toBe(
        firstRecipe.prepTime + firstRecipe.cookTime,
      );
    });

    it('should filter by user (user isolation)', async () => {
      // Create another user with their own recipes
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-list-test@example.com',
          firstName: 'Other',
          passwordHash: null,
        },
      });

      await prisma.recipe.create({
        data: {
          userId: otherUser.id,
          title: 'Other User Recipe',
          description: 'Should not appear',
          prepTime: 10,
          cookTime: 20,
          servings: 2,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const titles = response.body.data.map((r: any) => r.title);
      expect(titles).not.toContain('Other User Recipe');

      // Cleanup
      await prisma.recipe.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Pagination', () => {
    it('should support custom page and limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(2);
    });

    it('should reject limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes?limit=101')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return empty array for page beyond total pages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?page=999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('Sorting', () => {
    it('should sort by title ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const titles = response.body.data.map((r: any) => r.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('should sort by createdAt descending (default)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should sort by prepTime ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?sortBy=prepTime&sortOrder=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const prepTimes = response.body.data.map((r: any) => r.prepTime);
      for (let i = 1; i < prepTimes.length; i++) {
        expect(prepTimes[i]).toBeGreaterThanOrEqual(prepTimes[i - 1]);
      }
    });
  });

  describe('Tag Filtering', () => {
    it('should filter by single tag', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes?tagIds=${tag1Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((recipe: any) => {
        expect(recipe.tagIds).toContain(tag1Id);
      });
    });

    it('should filter by multiple tags with OR logic', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes?tagIds=${tag1Id},${tag2Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((recipe: any) => {
        const hasAnyTag =
          recipe.tagIds.includes(tag1Id) || recipe.tagIds.includes(tag2Id);
        expect(hasAnyTag).toBe(true);
      });
    });

    it('should return empty array for non-existent tag', async () => {
      const fakeTagId = '123e4567-e89b-12d3-a456-426614174999';
      const response = await request(app.getHttpServer())
        .get(`/api/recipes?tagIds=${fakeTagId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('Search Query', () => {
    it('should search in recipe title', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?q=chicken')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const titles = response.body.data.map((r: any) => r.title.toLowerCase());
      expect(titles.some((t: string) => t.includes('chicken'))).toBe(true);
    });

    it('should search in recipe description', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?q=veggie')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should search in ingredient names', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?q=broth')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?q=CHICKEN')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject search query < 2 characters', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes?q=a')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('Time Filtering', () => {
    it('should filter by maxTotalTime', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?maxTotalTime=60')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.data.forEach((recipe: any) => {
        expect(recipe.totalTime).toBeLessThanOrEqual(60);
      });
    });

    it('should exclude recipes exceeding maxTotalTime', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?maxTotalTime=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const slowRecipe = response.body.data.find(
        (r: any) => r.title === 'Slow Cooked Beef',
      );
      expect(slowRecipe).toBeUndefined(); // 30 + 180 = 210 minutes
    });
  });

  describe('Combined Filters', () => {
    it('should apply search + tags + time filters together', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/recipes?q=chicken&tagIds=${tag2Id}&maxTotalTime=60`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((recipe: any) => {
        expect(recipe.totalTime).toBeLessThanOrEqual(60);
        expect(recipe.tagIds).toContain(tag2Id);
      });
    });
  });

  describe('Performance', () => {
    it('should complete query in reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/recipes?page=1&limit=20')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no recipes match', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?q=nonexistentrecipename12345')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });
});
