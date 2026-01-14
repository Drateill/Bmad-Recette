import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';
import { StorageService } from '../../src/modules/storage/storage.service';
import { ImageProcessingService } from '../../src/common/services/image-processing.service';

describe('Recipe Photo Upload (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let recipeId: string;
  let otherRecipeId: string;

  // 1x1 transparent PNG base64
  const validImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

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

    // Mock StorageService to avoid real S3 calls in tests
    const mockStorageService = {
      uploadFile: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(`https://mock-bucket.s3.eu-west-1.amazonaws.com/${key}`);
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      generateFilename: jest.fn().mockImplementation((userId: string, recipeId: string, ext: string) => {
        return `${userId}/${recipeId}/mock-uuid.${ext}`;
      }),
      generateThumbnailFilename: jest.fn().mockImplementation((originalKey: string) => {
        return originalKey.replace(/\.(\w+)$/, '_thumb.$1');
      }),
      extractKeyFromUrl: jest.fn().mockImplementation((url: string) => {
        return url.split('.amazonaws.com/')[1] || '';
      }),
    };

    // Mock ImageProcessingService to avoid actual image processing in tests
    const mockImageProcessingService = {
      getMetadata: jest.fn().mockResolvedValue({
        width: 100,
        height: 100,
        format: 'png',
      }),
      optimizeImage: jest.fn().mockImplementation((buffer: Buffer) => {
        return Promise.resolve(buffer); // Return same buffer
      }),
      generateThumbnail: jest.fn().mockImplementation((buffer: Buffer) => {
        return Promise.resolve(buffer); // Return same buffer
      }),
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
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(ImageProcessingService)
      .useValue(mockImageProcessingService)
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

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and login
    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'phototest@example.com',
      password: 'Test1234',
      firstName: 'Photo',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'phototest@example.com',
        password: 'Test1234',
      });

    accessToken = loginResponse.body.accessToken;

    // Create test recipe owned by test user
    const recipeResponse = await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Recipe for Photos',
        description: 'Test description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        ingredients: [
          { ingredientName: 'Test Ingredient', quantity: 1, unit: 'cup' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Test step' },
        ],
        tagIds: [],
      });

    recipeId = recipeResponse.body.id;

    // Create another user and recipe for authorization tests
    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'other@example.com',
      password: 'Test1234',
      firstName: 'Other',
    });

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'Test1234',
      });

    const otherRecipeResponse = await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Authorization', `Bearer ${otherLoginResponse.body.accessToken}`)
      .send({
        title: 'Other User Recipe',
        description: 'Test description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        ingredients: [
          { ingredientName: 'Test Ingredient', quantity: 1, unit: 'cup' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Test step' },
        ],
        tagIds: [],
      });

    otherRecipeId = otherRecipeResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.recipePhoto.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  afterEach(async () => {
    // Clean up photos after each test
    await prisma.recipePhoto.deleteMany({});
  });

  describe('POST /api/recipes/:recipeId/photos - Upload Success', () => {
    it('should upload a valid image and return 201 with photo details', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test.png')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('recipeId', recipeId);
      expect(response.body).toHaveProperty('s3Url');
      expect(response.body).toHaveProperty('thumbnailUrl');
      expect(response.body).toHaveProperty('isPrimary', true); // First photo
      expect(response.body).toHaveProperty('fileSize');
      expect(response.body).toHaveProperty('width');
      expect(response.body).toHaveProperty('height');
      expect(response.body).toHaveProperty('uploadedAt');

      // Verify URLs have correct format
      expect(response.body.s3Url).toContain('s3');
      expect(response.body.thumbnailUrl).toContain('thumb');
    });

    it('should mark second photo as non-primary', async () => {
      // Upload first photo
      await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test1.png')
        .expect(201);

      // Upload second photo
      const response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test2.png')
        .expect(201);

      expect(response.body.isPrimary).toBe(false);
    });
  });

  describe('POST /api/recipes/:recipeId/photos - File Validation', () => {
    it('should reject file larger than 10MB', async () => {
      // Create a buffer larger than 10MB (simulated)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

      await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', largeBuffer, 'large.png')
        .expect(413); // Payload Too Large from Multer
    });

    it('should reject invalid file format', async () => {
      const textBuffer = Buffer.from('This is not an image');

      await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', textBuffer, 'test.txt')
        .expect(400);
    });

    it('should reject request without file', async () => {
      await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('POST /api/recipes/:recipeId/photos - Authorization', () => {
    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .attach('photo', validImageBuffer, 'test.png')
        .expect(401);
    });

    it('should reject upload to another user\'s recipe', async () => {
      await request(app.getHttpServer())
        .post(`/api/recipes/${otherRecipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test.png')
        .expect(403);
    });

    it('should return 404 for non-existent recipe', async () => {
      // Use a properly formatted UUID that doesn't exist
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .post(`/api/recipes/${nonExistentUuid}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test.png')
        .expect(404);
    });
  });

  describe('PUT /api/recipes/:recipeId/photos/:photoId/primary - Change Primary', () => {
    it('should change primary photo successfully', async () => {
      // Upload two photos
      const photo1Response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test1.png');

      const photo2Response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test2.png');

      const photo1Id = photo1Response.body.id;
      const photo2Id = photo2Response.body.id;

      // Change primary to photo2
      const response = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}/photos/${photo2Id}/primary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isPrimary).toBe(true);

      // Verify photo1 is no longer primary
      const photos = await prisma.recipePhoto.findMany({
        where: { recipeId },
      });

      const photo1Updated = photos.find((p) => p.id === photo1Id);
      const photo2Updated = photos.find((p) => p.id === photo2Id);

      expect(photo1Updated?.isPrimary).toBe(false);
      expect(photo2Updated?.isPrimary).toBe(true);
    });

    it('should reject changing primary for non-owned recipe', async () => {
      // Upload photo to other user's recipe
      const otherLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Test1234',
        });

      const otherAccessToken = otherLoginResponse.body.accessToken;

      const photoResponse = await request(app.getHttpServer())
        .post(`/api/recipes/${otherRecipeId}/photos`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .attach('photo', validImageBuffer, 'test.png');

      const photoId = photoResponse.body.id;

      // Try to change primary with wrong user
      await request(app.getHttpServer())
        .put(`/api/recipes/${otherRecipeId}/photos/${photoId}/primary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/recipes/:recipeId/photos/:photoId - Delete Photo', () => {
    it('should delete photo successfully', async () => {
      const photoResponse = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test.png')
        .expect(201);

      const photoId = photoResponse.body.id;
      expect(photoId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/api/recipes/${recipeId}/photos/${photoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify photo is deleted from database
      const photo = await prisma.recipePhoto.findUnique({
        where: { id: photoId },
      });

      expect(photo).toBeNull();
    });

    it('should auto-promote another photo when deleting primary', async () => {
      // Upload two photos
      const photo1Response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test1.png')
        .expect(201);

      const photo2Response = await request(app.getHttpServer())
        .post(`/api/recipes/${recipeId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('photo', validImageBuffer, 'test2.png')
        .expect(201);

      const photo1Id = photo1Response.body.id;
      const photo2Id = photo2Response.body.id;
      expect(photo1Id).toBeDefined();
      expect(photo2Id).toBeDefined();

      // Delete primary photo (photo1)
      await request(app.getHttpServer())
        .delete(`/api/recipes/${recipeId}/photos/${photo1Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify photo2 is now primary
      const photo2Updated = await prisma.recipePhoto.findUnique({
        where: { id: photo2Id },
      });

      expect(photo2Updated?.isPrimary).toBe(true);
    });

    it('should reject deleting photo from non-owned recipe', async () => {
      const otherLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Test1234',
        });

      const otherAccessToken = otherLoginResponse.body.accessToken;

      const photoResponse = await request(app.getHttpServer())
        .post(`/api/recipes/${otherRecipeId}/photos`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .attach('photo', validImageBuffer, 'test.png');

      const photoId = photoResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/recipes/${otherRecipeId}/photos/${photoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });
});
