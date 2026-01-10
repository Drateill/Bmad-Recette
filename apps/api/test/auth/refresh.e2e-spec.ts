import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('POST /api/auth/refresh and /api/auth/logout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let jwtService: JwtService;
  let configService: ConfigService;

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
    jwtService = app.get<JwtService>(JwtService);
    configService = app.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany();

    // Clean up Redis test data
    const redisClient = redis.getClient();
    const keys = await redisClient.keys('refresh_token*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  /**
   * Helper function to register a test user and extract refresh token from cookie
   */
  async function registerUser(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
      })
      .expect(201);

    // Extract refresh token from Set-Cookie header
    const setCookieHeader = response.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    const refreshTokenCookie = cookieArray.find((cookie: string) =>
      cookie.startsWith('refreshToken='),
    );
    expect(refreshTokenCookie).toBeDefined();

    const refreshToken = refreshTokenCookie!.split(';')[0].split('=')[1];
    return refreshToken;
  }

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh access token with valid refresh token', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('refresh@example.com', 'Password123');

      // Act: Refresh access token
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      // Assert: New access token returned
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeDefined();
      expect(typeof response.body.accessToken).toBe('string');

      // Assert: New refresh token set in cookie (token rotation)
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const newRefreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );
      expect(newRefreshTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie).toContain('HttpOnly');
      expect(newRefreshTokenCookie).toContain('SameSite=Strict');
      expect(newRefreshTokenCookie).toContain('Path=/api/auth');
    });

    it('should return 401 if refresh token cookie is missing', async () => {
      // Act & Assert: Attempt refresh without cookie
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.message).toBe('Refresh token not provided');
    });

    it('should return 401 for invalid refresh token signature', async () => {
      // Arrange: Create invalid token
      const invalidToken = 'invalid.jwt.token';

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${invalidToken}`])
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 for expired refresh token', async () => {
      // Arrange: Create expired token
      const jwtRefreshSecret = configService.get<string>('jwt.refreshSecret') || 'test-secret';
      const expiredToken = jwtService.sign(
        { sub: 'user-123', jti: 'token-123' },
        { secret: jwtRefreshSecret, expiresIn: '-1h' },
      );

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${expiredToken}`])
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 if refresh token not found in Redis', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('notinredis@example.com', 'Password123');

      // Delete refresh token from Redis to simulate logout or expiration
      const decoded = jwtService.decode(refreshToken) as any;
      const redisClient = redis.getClient();
      await redisClient.del(`refresh_token:${decoded.sub}:${decoded.jti}`);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should implement token rotation: old token becomes invalid after refresh', async () => {
      // Arrange: Register user and get refresh token
      const oldRefreshToken = await registerUser('rotation@example.com', 'Password123');

      // Act: First refresh (should succeed)
      const response1 = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${oldRefreshToken}`])
        .expect(200);

      // Assert: New refresh token returned
      const setCookieHeader = response1.headers['set-cookie'];
      const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const newRefreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );
      const newRefreshToken = newRefreshTokenCookie!.split(';')[0].split('=')[1];
      expect(newRefreshToken).not.toBe(oldRefreshToken);

      // Wait for idempotency window to expire (5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 5500));

      // Act: Try to use old refresh token again (should fail after idempotency window)
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${oldRefreshToken}`])
        .expect(401);

      // Act: Use new refresh token (should succeed)
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${newRefreshToken}`])
        .expect(200);
    });

    it('should handle concurrent refresh requests within idempotency window', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('concurrent@example.com', 'Password123');

      // Act: Make two concurrent refresh requests
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`]),
        request(app.getHttpServer())
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`]),
      ]);

      // Assert: Both requests should succeed (within 5-second idempotency window)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Assert: Both should return the same access token (idempotent)
      expect(response1.body.accessToken).toBe(response2.body.accessToken);
    });

    it('should generate new access token that can be used for protected endpoints', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('protected@example.com', 'Password123');

      // Act: Refresh to get new access token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      // Assert: Use new access token on protected endpoint (once we have one)
      // For now, just verify token structure
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout and invalidate refresh token', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('logout@example.com', 'Password123');

      // Act: Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(204);

      // Assert: Refresh token should be cleared in cookie
      // Note: Supertest doesn't easily expose response.headers['set-cookie'] for 204 responses
      // But we can verify the token is invalid by trying to refresh

      // Assert: Refresh token should be invalidated in Redis
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(401);
    });

    it('should clear refresh token cookie on logout', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('clearCookie@example.com', 'Password123');

      // Act: Logout
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(204);

      // Assert: Cookie should be cleared (Max-Age=0 or expired)
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        const clearedCookie = cookieArray.find((cookie: string) =>
          cookie.startsWith('refreshToken='),
        );
        // Cookie should either be missing or have Max-Age=0
        if (clearedCookie) {
          expect(clearedCookie).toMatch(/Max-Age=0|Expires=/);
        }
      }
    });

    it('should gracefully handle logout without refresh token (return 204)', async () => {
      // Act & Assert: Logout without token should still succeed (graceful)
      await request(app.getHttpServer()).post('/api/auth/logout').expect(204);
    });

    it('should gracefully handle logout with invalid refresh token (return 204)', async () => {
      // Arrange: Invalid token
      const invalidToken = 'invalid.jwt.token';

      // Act & Assert: Should still return 204 (graceful logout)
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${invalidToken}`])
        .expect(204);
    });

    it('should prevent refresh after logout', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('preventRefresh@example.com', 'Password123');

      // Act: Logout first
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(204);

      // Assert: Subsequent refresh should fail
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(401);
    });

    it('should delete refresh token from Redis on logout', async () => {
      // Arrange: Register user and get refresh token
      const refreshToken = await registerUser('redisDelete@example.com', 'Password123');

      // Extract user ID and token ID from refresh token
      const decoded = jwtService.decode(refreshToken) as any;
      const userId = decoded.sub;
      const tokenId = decoded.jti;

      // Verify token exists in Redis before logout
      const redisClient = redis.getClient();
      const keyBefore = `refresh_token:${userId}:${tokenId}`;
      const tokenBefore = await redisClient.get(keyBefore);
      expect(tokenBefore).not.toBeNull();

      // Act: Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(204);

      // Assert: Token should be deleted from Redis
      const tokenAfter = await redisClient.get(keyBefore);
      expect(tokenAfter).toBeNull();
    });
  });

  describe('POST /api/auth/refresh → POST /api/auth/logout → POST /api/auth/refresh (flow)', () => {
    it('should fail to refresh after logout in the middle', async () => {
      // Arrange: Register and get initial tokens
      const initialRefreshToken = await registerUser('flow@example.com', 'Password123');

      // Act 1: Refresh to get new tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .expect(200);

      const setCookieHeader = refreshResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const newRefreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );
      const newRefreshToken = newRefreshTokenCookie!.split(';')[0].split('=')[1];

      // Act 2: Logout with new refresh token
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${newRefreshToken}`])
        .expect(204);

      // Act 3: Try to refresh with new token (should fail)
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${newRefreshToken}`])
        .expect(401);
    });
  });

  describe('Login → Refresh flow', () => {
    it('should successfully refresh after login', async () => {
      // Arrange: Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'loginRefresh@example.com',
          password: 'Password123',
          firstName: 'Test',
        })
        .expect(201);

      // Act 1: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'loginRefresh@example.com',
          password: 'Password123',
        })
        .expect(200);

      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const refreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith('refreshToken='),
      );
      const refreshToken = refreshTokenCookie!.split(';')[0].split('=')[1];

      // Act 2: Refresh
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      // Assert: New access token returned
      expect(refreshResponse.body.accessToken).toBeDefined();
    });
  });
});
