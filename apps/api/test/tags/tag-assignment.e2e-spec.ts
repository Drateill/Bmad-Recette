import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { generateAccessToken } from '../../src/modules/auth/utils/jwt.util';

describe('Tag Assignment Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let recipeId: string;
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
        email: `test-tags-${Date.now()}@example.com`,
        firstName: 'TagTest',
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

    // Create test recipe
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: 'Test Recipe for Tags',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
      },
    });
    recipeId = recipe.id;

    // Get some system tags for testing
    const systemTags = await prisma.tag.findMany({
      where: { isSystem: true },
      take: 5,
    });
    tagIds = systemTags.map((tag) => tag.id);
  });

  afterAll(async () => {
    await prisma.recipeTag.deleteMany({ where: { recipeId } });
    await prisma.recipe.delete({ where: { id: recipeId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('POST /api/tags/recipes/:recipeId', () => {
    afterEach(async () => {
      await prisma.recipeTag.deleteMany({ where: { recipeId } });
    });

    it('should assign tags to a recipe with valid tagIds array', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: tagIds.slice(0, 3) })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      // Verify tags were assigned
      const assignedTags = await prisma.recipeTag.findMany({
        where: { recipeId },
      });
      expect(assignedTags).toHaveLength(3);
    });

    it('should replace existing tags (bulk assignment)', async () => {
      // First assignment
      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [tagIds[0], tagIds[1]] })
        .expect(200);

      // Second assignment (should replace)
      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [tagIds[2], tagIds[3]] })
        .expect(200);

      // Verify only new tags exist
      const assignedTags = await prisma.recipeTag.findMany({
        where: { recipeId },
      });
      expect(assignedTags).toHaveLength(2);
      expect(assignedTags.map((rt) => rt.tagId)).toEqual([
        tagIds[2],
        tagIds[3],
      ]);
    });

    it('should return 401 if no authorization token provided', async () => {
      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .send({ tagIds: [tagIds[0]] })
        .expect(401);
    });

    it('should return 403 if user does not own the recipe', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          firstName: 'Other',
          passwordHash: 'dummy',
        },
      });

      const otherAccessToken = generateAccessToken(
        otherUser.id,
        otherUser.email,
        'development-secret-change-in-production',
        '15m',
      );

      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ tagIds: [tagIds[0]] })
        .expect(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 404 if recipe does not exist', async () => {
      const fakeRecipeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${fakeRecipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [tagIds[0]] })
        .expect(404);
    });

    it('should return 400 if tagIds array is empty', async () => {
      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [] })
        .expect(400);
    });

    it('should return 400 if any tagId is invalid UUID', async () => {
      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: ['invalid-uuid', tagIds[0]] })
        .expect(400);
    });

    it('should return 400 if any tagId does not exist', async () => {
      const fakeTagId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [tagIds[0], fakeTagId] })
        .expect(400);
    });

    it('should handle transaction rollback if any tagId is invalid', async () => {
      const fakeTagId = '00000000-0000-0000-0000-000000000001';

      await request(app.getHttpServer())
        .post(`/api/tags/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tagIds: [tagIds[0], fakeTagId] })
        .expect(400);

      // Verify no tags were assigned
      const assignedTags = await prisma.recipeTag.findMany({
        where: { recipeId },
      });
      expect(assignedTags).toHaveLength(0);
    });
  });

  describe('GET /api/tags/recipes/:recipeId', () => {
    beforeEach(async () => {
      // Assign some tags
      await prisma.recipeTag.createMany({
        data: tagIds.slice(0, 3).map((tagId) => ({
          recipeId,
          tagId,
        })),
      });
    });

    afterEach(async () => {
      await prisma.recipeTag.deleteMany({ where: { recipeId } });
    });

    it('should get tags assigned to a recipe', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tags/recipes/${recipeId}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('tag');
      expect(response.body[0].tag).toHaveProperty('category');
    });

    it('should return empty array if recipe has no tags', async () => {
      await prisma.recipeTag.deleteMany({ where: { recipeId } });

      const response = await request(app.getHttpServer())
        .get(`/api/tags/recipes/${recipeId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/tags/categories', () => {
    it('should get all tag categories with nested tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags/categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(6);

      const category = response.body[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('sortOrder');
      expect(category).toHaveProperty('tags');
      expect(category.tags).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/tags', () => {
    it('should get all tags without filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter tags by categoryId', async () => {
      const category = await prisma.tagCategory.findFirst({
        where: { slug: 'diet-health' },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/tags?categoryId=${category?.id}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((tag: any) => {
        expect(tag.categoryId).toBe(category?.id);
      });
    });

    it('should filter tags by isSystem=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags?isSystem=true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((tag: any) => {
        expect(tag.isSystem).toBe(true);
        expect(tag.userId).toBeNull();
      });
    });
  });

  describe('GET /api/tags/system', () => {
    it('should get only system tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags/system')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(100);
      response.body.forEach((tag: any) => {
        expect(tag.isSystem).toBe(true);
        expect(tag.userId).toBeNull();
      });
    });
  });

  describe('GET /api/tags/user', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/api/tags/user').expect(401);
    });

    it('should get user custom tags when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      // User has no custom tags yet
      response.body.forEach((tag: any) => {
        expect(tag.isSystem).toBe(false);
        expect(tag.userId).toBe(userId);
      });
    });
  });
});
