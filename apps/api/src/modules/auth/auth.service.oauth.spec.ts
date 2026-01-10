import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../redis/redis.service';
import * as jwtUtil from './utils/jwt.util';

describe('AuthService - OAuth', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let mockRedisClient: any;

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    passwordHash: null, // OAuth users have no password
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSyncedAt: new Date('2024-01-01'),
  };

  const mockAccessToken = 'mock.access.token';
  const mockRefreshToken = 'mock.refresh.token';

  beforeEach(async () => {
    // Mock Redis client
    mockRedisClient = {
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findByOAuthProvider: jest.fn(),
            createWithOAuth: jest.fn(),
            linkOAuthProvider: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'jwt.secret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh-secret',
                'jwt.accessTokenExpiration': '15m',
                'jwt.refreshTokenExpiration': '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository) as jest.Mocked<AuthRepository>;

    // Mock JWT utilities
    jest.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue(mockAccessToken);
    jest.spyOn(jwtUtil, 'generateRefreshToken').mockReturnValue({
      token: mockRefreshToken,
      tokenId: 'mock-token-id',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOAuthLogin', () => {
    it('should create new user for new OAuth account', async () => {
      // Arrange
      const oauthPayload = {
        provider: 'google',
        providerId: 'google-user-123',
        email: 'newuser@gmail.com',
        firstName: 'Jane',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(null);
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.createWithOAuth.mockResolvedValue({
        ...mockUser,
        email: 'newuser@gmail.com',
        firstName: 'Jane',
      });

      // Act
      const result = await service.handleOAuthLogin(oauthPayload);

      // Assert
      expect(authRepository.createWithOAuth).toHaveBeenCalledWith(
        { email: 'newuser@gmail.com', firstName: 'Jane', passwordHash: null },
        { provider: 'google', providerId: 'google-user-123', email: 'newuser@gmail.com' },
      );
      expect(result.user.email).toBe('newuser@gmail.com');
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('should link OAuth to existing email/password user', async () => {
      // Arrange
      const existingUser = {
        ...mockUser,
        id: 'uuid-existing',
        email: 'existing@example.com',
        passwordHash: '$2b$10$hashedpassword', // Has password
      };
      const oauthPayload = {
        provider: 'google',
        providerId: 'google-user-456',
        email: 'existing@example.com',
        firstName: 'John',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(null);
      authRepository.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await service.handleOAuthLogin(oauthPayload);

      // Assert
      expect(authRepository.linkOAuthProvider).toHaveBeenCalledWith(
        'uuid-existing',
        { provider: 'google', providerId: 'google-user-456', email: 'existing@example.com' },
      );
      expect(authRepository.createWithOAuth).not.toHaveBeenCalled();
      expect(result.user.id).toBe('uuid-existing');
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('should return existing user for known OAuth account', async () => {
      // Arrange
      const existingOAuthUser = {
        ...mockUser,
        id: 'uuid-oauth',
        email: 'oauth@example.com',
        passwordHash: null, // OAuth-only user
      };
      const oauthPayload = {
        provider: 'google',
        providerId: 'google-user-789',
        email: 'oauth@example.com',
        firstName: 'Jane',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(existingOAuthUser);

      // Act
      const result = await service.handleOAuthLogin(oauthPayload);

      // Assert
      expect(authRepository.createWithOAuth).not.toHaveBeenCalled();
      expect(authRepository.linkOAuthProvider).not.toHaveBeenCalled();
      expect(authRepository.findByEmail).not.toHaveBeenCalled();
      expect(result.user.id).toBe('uuid-oauth');
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('should throw error if OAuth payload missing email for new user', async () => {
      // Arrange - Apple user hides email on first login
      const oauthPayload = {
        provider: 'apple',
        providerId: 'apple-user-123',
        email: null, // Missing email
        firstName: 'John',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(null);

      // Act & Assert
      await expect(service.handleOAuthLogin(oauthPayload as any))
        .rejects.toThrow(BadRequestException);
      await expect(service.handleOAuthLogin(oauthPayload as any))
        .rejects.toThrow('Email required for account creation');
    });

    it('should handle Apple subsequent login with null email (bug fix)', async () => {
      // Arrange - Existing Apple OAuth user
      const existingAppleUser = {
        ...mockUser,
        id: 'uuid-apple',
        email: 'appleuser@icloud.com',
        passwordHash: null,
      };
      const oauthPayload = {
        provider: 'apple',
        providerId: 'apple-user-123',
        email: null, // Apple doesn't provide on subsequent logins
        firstName: 'Apple',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(existingAppleUser);

      // Act
      const result = await service.handleOAuthLogin(oauthPayload as any);

      // Assert
      expect(authRepository.findByOAuthProvider).toHaveBeenCalledWith('apple', 'apple-user-123');
      expect(result.user.id).toBe('uuid-apple');
      expect(result.user.email).toBe('appleuser@icloud.com');
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
      // Should NOT throw BadRequestException
    });

    it('should link multiple OAuth providers to same user', async () => {
      // Arrange - User already has Google linked
      const existingUser = {
        ...mockUser,
        id: 'uuid-multi',
        email: 'user@example.com',
        passwordHash: null,
      };
      const appleOAuthPayload = {
        provider: 'apple',
        providerId: 'apple-user-456',
        email: 'user@example.com', // Same email as Google
        firstName: 'User',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(null); // Apple not linked yet
      authRepository.findByEmail.mockResolvedValue(existingUser); // Email exists

      // Act
      const result = await service.handleOAuthLogin(appleOAuthPayload);

      // Assert
      expect(authRepository.linkOAuthProvider).toHaveBeenCalledWith(
        'uuid-multi',
        { provider: 'apple', providerId: 'apple-user-456', email: 'user@example.com' },
      );
      expect(result.user.id).toBe('uuid-multi');
    });

    it('should return same JWT token structure as email/password login', async () => {
      // Arrange
      const oauthPayload = {
        provider: 'google',
        providerId: 'google-test',
        email: 'test@gmail.com',
        firstName: 'Test',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(null);
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.createWithOAuth.mockResolvedValue({
        ...mockUser,
        email: 'test@gmail.com',
      });

      // Act
      const result = await service.handleOAuthLogin(oauthPayload);

      // Assert - Same structure as LoginResponseDto
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).not.toHaveProperty('passwordHash'); // Excluded from response
      expect(jwtUtil.generateAccessToken).toHaveBeenCalled();
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalled();
    });

    it('should allow OAuth user with null passwordHash', async () => {
      // Arrange
      const oauthUserWithoutPassword = {
        ...mockUser,
        passwordHash: null, // No password
      };
      const oauthPayload = {
        provider: 'google',
        providerId: 'google-no-pass',
        email: 'nopw@example.com',
        firstName: 'NoPassword',
      };
      authRepository.findByOAuthProvider.mockResolvedValue(oauthUserWithoutPassword);

      // Act
      const result = await service.handleOAuthLogin(oauthPayload);

      // Assert - Should work fine with null password
      expect(result.user.id).toBe('uuid-123');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
