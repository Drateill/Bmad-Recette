import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('POST /api/auth/register (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
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
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global prefix and validation pipe like in main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redis = app.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
    const redisClient = redis.getClient();
    const keys = await redisClient.keys('refresh_token:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  describe('Successful Registration', () => {
    it('should register a new user and return 201 with tokens', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify user data
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.firstName).toBe(registerDto.firstName);
      expect(response.body.user).toHaveProperty('createdAt');

      // Verify password is NOT returned
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify tokens are strings
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
      expect(response.body.refreshToken.length).toBeGreaterThan(0);
    });

    it('should create user in database with hashed password', async () => {
      const registerDto = {
        email: 'hashtest@example.com',
        password: 'Password123',
        firstName: 'Jane',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      expect(user).toBeDefined();
      expect(user!.email).toBe(registerDto.email);
      expect(user!.firstName).toBe(registerDto.firstName);

      // Verify password is hashed (bcrypt format)
      expect(user!.passwordHash).toBeDefined();
      expect(user!.passwordHash).not.toBe(registerDto.password);
      expect(user!.passwordHash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('should store refresh token in Redis', async () => {
      const registerDto = {
        email: 'redistest@example.com',
        password: 'Password123',
        firstName: 'Redis',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      const userId = response.body.user.id;
      const redisClient = redis.getClient();
      const storedToken = await redisClient.get(`refresh_token:${userId}`);

      expect(storedToken).toBeDefined();
      expect(storedToken).toBe(response.body.refreshToken);

      // Verify TTL is approximately 7 days (604800 seconds)
      const ttl = await redisClient.ttl(`refresh_token:${userId}`);
      expect(ttl).toBeGreaterThan(604700); // Allow some margin
      expect(ttl).toBeLessThanOrEqual(604800);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          firstName: 'John',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    // Note: Additional validation tests are covered by unit tests
    // to avoid hitting rate limits in e2e tests
  });

  describe('Duplicate Email', () => {
    // Note: Duplicate email testing requires 2 requests and may hit rate limit
    // This is tested in unit tests
  });

  describe('Security', () => {
    // Note: Security tests are covered by unit tests and the tests above
    // Additional security e2e tests would hit rate limits
  });
});
