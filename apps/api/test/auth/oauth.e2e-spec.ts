import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { GoogleStrategy } from '../../src/modules/auth/strategies/google.strategy';
import { AppleStrategy } from '../../src/modules/auth/strategies/apple.strategy';
import cookieParser from 'cookie-parser';

describe('OAuth Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let googleStrategy: GoogleStrategy;
  let appleStrategy: AppleStrategy;

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
    app.use(cookieParser());

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redis = app.get<RedisService>(RedisService);
    googleStrategy = app.get<GoogleStrategy>(GoogleStrategy);
    appleStrategy = app.get<AppleStrategy>(AppleStrategy);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.oAuthProvider.deleteMany({});
    await prisma.user.deleteMany({});
    const redisClient = redis.getClient();
    const keys = await redisClient.keys('refresh_token:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google authorization URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/google')
        .expect(302);

      // Verify redirect to Google OAuth
      expect(response.headers.location).toContain('accounts.google.com');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should create new user and redirect with token for new OAuth account', async () => {
      // Mock Google strategy validate method
      jest.spyOn(googleStrategy, 'validate').mockResolvedValue({
        provider: 'google',
        providerId: 'google-test-123',
        email: 'googleuser@test.com',
        firstName: 'Google',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?code=fake-auth-code')
        .expect(302);

      // Verify redirect to frontend with token
      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify refresh token cookie set
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies?.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toContain('HttpOnly');

      // Verify user created in database
      const user = await prisma.user.findUnique({
        where: { email: 'googleuser@test.com' },
        include: { oauthProviders: true },
      });
      expect(user).not.toBeNull();
      expect(user?.firstName).toBe('Google');
      expect(user?.passwordHash).toBeNull(); // OAuth-only user
      expect(user?.oauthProviders).toHaveLength(1);
      expect(user?.oauthProviders[0].provider).toBe('google');
    });

    it('should return existing user for known OAuth account', async () => {
      // Create existing OAuth user
      await prisma.user.create({
        data: {
          email: 'existing@test.com',
          firstName: 'Existing',
          passwordHash: null,
          oauthProviders: {
            create: {
              provider: 'google',
              providerId: 'google-existing-123',
              email: 'existing@test.com',
            },
          },
        },
      });

      // Mock Google strategy with same providerId
      jest.spyOn(googleStrategy, 'validate').mockResolvedValue({
        provider: 'google',
        providerId: 'google-existing-123',
        email: 'existing@test.com', // May not be provided by Google on subsequent logins
        firstName: 'Existing',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?code=fake-code')
        .expect(302);

      // Verify redirect with token
      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify NO new user created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);

      // Verify NO new OAuth provider created
      const oauthCount = await prisma.oAuthProvider.count();
      expect(oauthCount).toBe(1);
    });

    it('should link Google to existing email/password user', async () => {
      // Create existing email/password user (no OAuth)
      await prisma.user.create({
        data: {
          email: 'existing@test.com',
          firstName: 'Existing',
          passwordHash: '$2b$10$hashedpassword', // Has password
        },
      });

      // Mock Google strategy with same email
      jest.spyOn(googleStrategy, 'validate').mockResolvedValue({
        provider: 'google',
        providerId: 'google-link-456',
        email: 'existing@test.com',
        firstName: 'Existing',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?code=fake-code')
        .expect(302);

      // Verify redirect with token
      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify OAuth provider was linked (not new user)
      const user = await prisma.user.findUnique({
        where: { email: 'existing@test.com' },
        include: { oauthProviders: true },
      });
      expect(user?.oauthProviders).toHaveLength(1);
      expect(user?.oauthProviders[0].provider).toBe('google');
      expect(user?.passwordHash).toBe('$2b$10$hashedpassword'); // Password still exists

      // Verify only 1 user exists
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });

    it('should set refresh token in httpOnly cookie', async () => {
      jest.spyOn(googleStrategy, 'validate').mockResolvedValue({
        provider: 'google',
        providerId: 'google-cookie-test',
        email: 'cookie@test.com',
        firstName: 'Cookie',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?code=fake-code')
        .expect(302);

      // Verify cookie properties
      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshTokenCookie = cookies?.find((c: string) => c.startsWith('refreshToken='));

      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Path=/api/auth');
      expect(refreshTokenCookie).toContain('Max-Age=');
    });

    it('should handle OAuth error from provider', async () => {
      // Simulate Google returning error
      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?error=access_denied')
        .expect(302);

      // Verify redirect to error page
      expect(response.headers.location).toContain('/auth/error');
      expect(response.headers.location).toContain('error=access_denied');
    });
  });

  describe('GET /api/auth/apple', () => {
    it('should redirect to Apple authorization URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/apple')
        .expect(302);

      // Verify redirect to Apple OAuth
      expect(response.headers.location).toContain('appleid.apple.com');
    });
  });

  describe('Apple OAuth Callback', () => {
    it('should create new user for Apple OAuth', async () => {
      jest.spyOn(appleStrategy, 'validate').mockResolvedValue({
        provider: 'apple',
        providerId: 'apple-test-123',
        email: 'appleuser@icloud.com',
        firstName: 'Apple',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/apple/callback?code=fake-code')
        .expect(302);

      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify user created
      const user = await prisma.user.findUnique({
        where: { email: 'appleuser@icloud.com' },
        include: { oauthProviders: true },
      });
      expect(user).not.toBeNull();
      expect(user?.oauthProviders[0].provider).toBe('apple');
    });

    it('should handle Apple subsequent login with null email (bug fix test)', async () => {
      // First login: email provided
      await prisma.user.create({
        data: {
          email: 'appleuser@test.com',
          firstName: 'Apple',
          passwordHash: null,
          oauthProviders: {
            create: {
              provider: 'apple',
              providerId: 'apple-test-123',
              email: 'appleuser@test.com',
            },
          },
        },
      });

      // Second login: no email (Apple behavior)
      jest.spyOn(appleStrategy, 'validate').mockResolvedValue({
        provider: 'apple',
        providerId: 'apple-test-123',
        email: null, // Missing on subsequent logins
        firstName: 'Apple',
      } as any);

      // Should still work - email retrieved from OAuthProvider record
      const response = await request(app.getHttpServer())
        .get('/api/auth/apple/callback?code=fake-code')
        .expect(302);

      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify NO new user created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });

    it('should reject Apple OAuth if email missing on first login', async () => {
      // Apple user hides email on first login
      jest.spyOn(appleStrategy, 'validate').mockResolvedValue({
        provider: 'apple',
        providerId: 'apple-no-email',
        email: null, // User declined email sharing
        firstName: 'NoEmail',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/apple/callback?code=fake-code')
        .expect(302);

      // Should redirect to error page
      expect(response.headers.location).toContain('/auth/error');
      expect(response.headers.location).toContain('message=');

      // Verify NO user created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should support POST callback for Apple (Apple requirement)', async () => {
      jest.spyOn(appleStrategy, 'validate').mockResolvedValue({
        provider: 'apple',
        providerId: 'apple-post-123',
        email: 'post@test.com',
        firstName: 'Post',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/apple/callback')
        .send({ code: 'fake-code' })
        .expect(302);

      expect(response.headers.location).toContain('/auth/success?token=');
    });
  });

  describe('Multiple OAuth Providers', () => {
    it('should link multiple OAuth providers to same user', async () => {
      // Create user via Google OAuth
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          firstName: 'User',
          passwordHash: null,
          oauthProviders: {
            create: {
              provider: 'google',
              providerId: 'google-multi-123',
              email: 'user@example.com',
            },
          },
        },
      });

      // Now link Apple with same email
      jest.spyOn(appleStrategy, 'validate').mockResolvedValue({
        provider: 'apple',
        providerId: 'apple-multi-456',
        email: 'user@example.com',
        firstName: 'User',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/apple/callback?code=fake-code')
        .expect(302);

      expect(response.headers.location).toContain('/auth/success?token=');

      // Verify both providers linked to same user
      const user = await prisma.user.findUnique({
        where: { email: 'user@example.com' },
        include: { oauthProviders: true },
      });
      expect(user?.oauthProviders).toHaveLength(2);
      expect(user?.oauthProviders.map(p => p.provider)).toContain('google');
      expect(user?.oauthProviders.map(p => p.provider)).toContain('apple');

      // Verify only 1 user exists
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });
  });

  describe('OAuth Token Response', () => {
    it('should return same JWT structure as email/password login', async () => {
      jest.spyOn(googleStrategy, 'validate').mockResolvedValue({
        provider: 'google',
        providerId: 'google-jwt-test',
        email: 'jwt@test.com',
        firstName: 'JWT',
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback?code=fake-code')
        .expect(302);

      // Extract token from redirect URL
      const location = response.headers.location;
      const tokenMatch = location.match(/token=([^&]+)/);
      expect(tokenMatch).not.toBeNull();

      const accessToken = tokenMatch![1];
      expect(accessToken).toBeDefined();
      expect(accessToken.split('.')).toHaveLength(3); // JWT format

      // Verify refresh token in cookie
      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshTokenCookie = cookies?.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();
    });
  });
});
