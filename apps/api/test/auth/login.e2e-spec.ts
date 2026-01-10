import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('POST /api/auth/login (e2e)', () => {
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

    // Apply global prefix, cookie parser, and validation pipe like in main.ts
    app.setGlobalPrefix('api');
    app.use(cookieParser());
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

  describe('Successful Login', () => {
    it('should login successfully and return 200 with user and accessToken', async () => {
      // First, register a user
      const registerDto = {
        email: 'testuser@example.com',
        password: 'Test1234',
        firstName: 'Test',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto);

      // Now login
      const loginDto = {
        email: 'testuser@example.com',
        password: 'Test1234',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken'); // refreshToken in cookie, not body

      // Verify user data
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('createdAt');

      // Verify password is NOT returned
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify accessToken is a string
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should set refreshToken in httpOnly cookie', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'cookietest@example.com',
          password: 'Test1234',
          firstName: 'Cookie',
        });

      // Login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'cookietest@example.com',
          password: 'Test1234',
        })
        .expect(200);

      // Verify cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const refreshTokenCookie = (cookies as unknown as string[]).find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
      expect(refreshTokenCookie).toContain('Path=/api/auth');
    });

    it('should perform case-insensitive email login', async () => {
      // Register with lowercase
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'casetest@example.com',
          password: 'Test1234',
          firstName: 'Case',
        });

      // Login with uppercase
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'CASETEST@EXAMPLE.COM',
          password: 'Test1234',
        })
        .expect(200);

      expect(response.body.user.email).toBe('casetest@example.com');
    });

    it('should store refresh token in Redis', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'redistest@example.com',
          password: 'Test1234',
          firstName: 'Redis',
        });

      // Login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'redistest@example.com',
          password: 'Test1234',
        })
        .expect(200);

      // Verify refresh token is in Redis
      const userId = response.body.user.id;
      const redisClient = redis.getClient();
      const storedToken = await redisClient.get(`refresh_token:${userId}`);
      expect(storedToken).toBeDefined();
      expect(typeof storedToken).toBe('string');
    });
  });

  describe('Failed Login - Invalid Credentials', () => {
    it('should return 401 for non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notexist@example.com',
          password: 'Test1234',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'wrongpass@example.com',
          password: 'CorrectPassword',
          firstName: 'Wrong',
        });

      // Login with wrong password
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return same generic error for non-existent email and wrong password', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'errortest@example.com',
          password: 'Test1234',
          firstName: 'Error',
        });

      // Wrong password
      const response1 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'errortest@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      // Non-existent email
      const response2 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notexist@example.com',
          password: 'Test1234',
        })
        .expect(401);

      // Both should have same generic message
      expect(response1.body.message).toBe('Invalid credentials');
      expect(response2.body.message).toBe('Invalid credentials');
      expect(response1.body.message).toBe(response2.body.message);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Test1234',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: 'Test1234',
        })
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 for empty password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after 10 attempts', async () => {
      // Override throttler for this test only
      const testApp = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideModule(ThrottlerModule)
        .useModule(
          ThrottlerModule.forRoot([
            {
              ttl: 60000,
              limit: 10, // Set to actual limit for this test
            },
          ]),
        )
        .compile();

      const rateTestApp = testApp.createNestApplication();
      rateTestApp.setGlobalPrefix('api');
      rateTestApp.use(cookieParser());
      rateTestApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
      );
      await rateTestApp.init();

      // Make 10 login attempts
      for (let i = 0; i < 10; i++) {
        await request(rateTestApp.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'ratetest@example.com',
            password: 'WrongPassword',
          });
      }

      // 11th attempt should be rate limited
      const response = await request(rateTestApp.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'ratetest@example.com',
          password: 'WrongPassword',
        })
        .expect(429);

      expect(response.body.message).toContain('ThrottlerException');

      await rateTestApp.close();
    }, 15000); // Increase timeout for this test
  });

  describe('Security', () => {
    it('should never return passwordHash in response', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'securitytest@example.com',
          password: 'Test1234',
          firstName: 'Security',
        });

      // Login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'securitytest@example.com',
          password: 'Test1234',
        })
        .expect(200);

      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });

    it('should set cookie with correct security attributes in development', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'cookiesec@example.com',
          password: 'Test1234',
          firstName: 'CookieSec',
        });

      // Login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'cookiesec@example.com',
          password: 'Test1234',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const refreshTokenCookie = (cookies as unknown as string[]).find((c) =>
        c.startsWith('refreshToken='),
      );

      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
      expect(refreshTokenCookie).toContain('Path=/api/auth');
      expect(refreshTokenCookie).toContain('Max-Age=604800'); // 7 days in seconds
    });
  });
});
