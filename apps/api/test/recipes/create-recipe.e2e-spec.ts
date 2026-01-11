import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { generateAccessToken } from '../../src/modules/auth/utils/jwt.util';

describe('POST /api/recipes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let tagIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and get access token
    const user = await prisma.user.create({
      data: {
        email: `test-recipe-${Date.now()}@example.com`,
        firstName: 'RecipeTest',
        passwordHash: 'dummy-hash',
      },
    });
    userId = user.id;

    accessToken = generateAccessToken(
      user.id,
      user.email,
      'development-secret-change-in-production',
      '15m',
    );

    // Create test tags
    const tagCategory = await prisma.tagCategory.create({
      data: {
        name: 'Meal Type',
        slug: 'meal-type',
        sortOrder: 1,
      },
    });

    const tag1 = await prisma.tag.create({
      data: {
        categoryId: tagCategory.id,
        name: 'Breakfast',
        slug: 'breakfast',
        isSystem: true,
      },
    });

    const tag2 = await prisma.tag.create({
      data: {
        categoryId: tagCategory.id,
        name: 'Lunch',
        slug: 'lunch',
        isSystem: true,
      },
    });

    tagIds = [tag1.id, tag2.id];
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.recipeTag.deleteMany({ where: { recipe: { userId } } });
    await prisma.recipeStep.deleteMany({ where: { recipe: { userId } } });
    await prisma.recipeIngredient.deleteMany({ where: { recipe: { userId } } });
    await prisma.recipe.deleteMany({ where: { userId } });
    await prisma.tag.deleteMany({});
    await prisma.tagCategory.deleteMany({});
    await prisma.user.deleteMany({ where: { id: userId } });

    await app.close();
  });

  describe('Successful recipe creation', () => {
    it('should create recipe and return 201 with complete object', async () => {
      const createRecipeDto = {
        title: 'Chocolate Chip Cookies',
        description: 'Classic homemade chocolate chip cookies',
        prepTime: 15,
        cookTime: 12,
        servings: 24,
        ingredients: [
          {
            quantity: 2.25,
            unit: 'cups',
            ingredientName: 'all-purpose flour',
          },
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'butter',
          },
          {
            quantity: 2,
            unit: 'cups',
            ingredientName: 'chocolate chips',
          },
        ],
        steps: [
          {
            instruction: 'Preheat oven to 375°F',
            duration: 5,
          },
          {
            instruction: 'Mix dry ingredients in a bowl',
            duration: 3,
          },
          {
            instruction: 'Cream butter and sugars, add eggs',
            duration: 5,
          },
          {
            instruction: 'Combine wet and dry ingredients, fold in chocolate chips',
            duration: 3,
          },
          {
            instruction: 'Bake for 10-12 minutes until golden brown',
            duration: 12,
          },
        ],
        tagIds: [tagIds[0]],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createRecipeDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId: userId,
        title: 'Chocolate Chip Cookies',
        description: 'Classic homemade chocolate chip cookies',
        prepTime: 15,
        cookTime: 12,
        servings: 24,
        version: 1,
      });

      expect(response.body.ingredients).toHaveLength(3);
      expect(response.body.ingredients[0]).toMatchObject({
        ingredientName: 'all-purpose flour',
        quantity: 2.25,
        unit: 'cups',
        sortOrder: 1,
      });

      expect(response.body.steps).toHaveLength(5);
      expect(response.body.steps[0]).toMatchObject({
        stepNumber: 1,
        instruction: 'Preheat oven to 375°F',
        duration: 5,
      });

      expect(response.body.tags).toHaveLength(1);
      expect(response.body.photos).toHaveLength(0);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should create recipe with minimum required fields', async () => {
      const minimalDto = {
        title: 'Simple Scrambled Eggs',
        prepTime: 2,
        cookTime: 3,
        servings: 1,
        ingredients: [
          {
            quantity: 2,
            unit: 'pieces',
            ingredientName: 'eggs',
          },
        ],
        steps: [
          {
            instruction: 'Crack eggs into pan and scramble',
          },
        ],
        tagIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(minimalDto)
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Simple Scrambled Eggs',
        prepTime: 2,
        cookTime: 3,
        servings: 1,
        description: null,
      });
    });

    it('should auto-assign stepNumbers when omitted', async () => {
      const dtoWithoutStepNumbers = {
        title: 'Test Auto Step Numbers',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'water',
          },
        ],
        steps: [
          { instruction: 'First step' },
          { instruction: 'Second step' },
          { instruction: 'Third step' },
        ],
        tagIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dtoWithoutStepNumbers)
        .expect(201);

      expect(response.body.steps[0].stepNumber).toBe(1);
      expect(response.body.steps[1].stepNumber).toBe(2);
      expect(response.body.steps[2].stepNumber).toBe(3);
    });
  });

  describe('Authentication and authorization', () => {
    it('should return 401 Unauthorized without JWT token', async () => {
      const createRecipeDto = {
        title: 'Test Recipe',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .send(createRecipeDto)
        .expect(401);
    });

    it('should associate recipe with authenticated user', async () => {
      const createRecipeDto = {
        title: 'User Association Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createRecipeDto)
        .expect(201);

      expect(response.body.userId).toBe(userId);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing title', async () => {
      const invalidDto = {
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toContain('title');
    });

    it('should return 400 for negative prepTime', async () => {
      const invalidDto = {
        title: 'Invalid Prep Time',
        prepTime: -5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for servings less than 1', async () => {
      const invalidDto = {
        title: 'Invalid Servings',
        prepTime: 5,
        cookTime: 10,
        servings: 0,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for empty ingredients array', async () => {
      const invalidDto = {
        title: 'No Ingredients',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for empty steps array', async () => {
      const invalidDto = {
        title: 'No Steps',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [],
        tagIds: [],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for invalid tagId', async () => {
      const invalidDto = {
        title: 'Invalid Tag',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: ['invalid-uuid-not-in-db'],
      };

      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('XSS prevention', () => {
    it('should sanitize HTML in description field', async () => {
      const dtoWithXSS = {
        title: 'XSS Test',
        description: '<script>alert("xss")</script>Safe description',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dtoWithXSS)
        .expect(201);

      expect(response.body.description).not.toContain('<script>');
      expect(response.body.description).toContain('Safe description');
    });
  });

  describe('Nested relations', () => {
    it('should include ingredients, steps, and tags in response', async () => {
      const createRecipeDto = {
        title: 'Relations Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            quantity: 1,
            unit: 'cup',
            ingredientName: 'test ingredient',
          },
        ],
        steps: [
          {
            instruction: 'Test step',
          },
        ],
        tagIds: [tagIds[0], tagIds[1]],
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createRecipeDto)
        .expect(201);

      expect(response.body.ingredients).toBeDefined();
      expect(Array.isArray(response.body.ingredients)).toBe(true);

      expect(response.body.steps).toBeDefined();
      expect(Array.isArray(response.body.steps)).toBe(true);

      expect(response.body.tags).toBeDefined();
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags).toHaveLength(2);

      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });
  });
});
