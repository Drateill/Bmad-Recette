import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { PrismaService } from '../../database/prisma.service';

describe('AuthRepository - OAuth Methods', () => {
  let repository: AuthRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockUser: any = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    passwordHash: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSyncedAt: new Date('2024-01-01'),
    oauthProviders: [],
  };

  const mockOAuthProvider = {
    id: 'oauth-uuid',
    userId: 'uuid-123',
    provider: 'google',
    providerId: 'google-user-123',
    email: 'test@example.com',
    linkedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            oAuthProvider: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByOAuthProvider', () => {
    it('should find user by OAuth provider and providerId', async () => {
      // Arrange
      const userWithOAuth = {
        ...mockUser,
        oauthProviders: [mockOAuthProvider],
      };
      prisma.user.findFirst = jest.fn().mockResolvedValue(userWithOAuth);

      // Act
      const result = await repository.findByOAuthProvider('google', 'google-user-123');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          oauthProviders: {
            some: {
              provider: 'google',
              providerId: 'google-user-123',
            },
          },
        },
        include: {
          oauthProviders: true,
        },
      });
      expect(result).toEqual(userWithOAuth);
      expect((result as any)?.oauthProviders).toHaveLength(1);
    });

    it('should return null if OAuth provider not found', async () => {
      // Arrange
      prisma.user.findFirst = jest.fn().mockResolvedValue(null);

      // Act
      const result = await repository.findByOAuthProvider('apple', 'apple-unknown');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should include oauthProviders in result', async () => {
      // Arrange
      const userWithMultipleOAuth = {
        ...mockUser,
        oauthProviders: [
          mockOAuthProvider,
          { ...mockOAuthProvider, id: 'oauth-uuid-2', provider: 'apple', providerId: 'apple-123' },
        ],
      };
      prisma.user.findFirst = jest.fn().mockResolvedValue(userWithMultipleOAuth);

      // Act
      const result = await repository.findByOAuthProvider('google', 'google-user-123');

      // Assert
      expect((result as any)?.oauthProviders).toHaveLength(2);
    });
  });

  describe('createWithOAuth', () => {
    it('should create user with OAuth provider in transaction', async () => {
      // Arrange
      const userData = {
        email: 'newuser@gmail.com',
        firstName: 'Jane',
        passwordHash: null,
      };
      const oauthData = {
        provider: 'google',
        providerId: 'google-new-123',
        email: 'newuser@gmail.com',
      };
      const createdUser = {
        ...mockUser,
        email: 'newuser@gmail.com',
        firstName: 'Jane',
        oauthProviders: [{ ...mockOAuthProvider, ...oauthData }],
      };
      prisma.user.create = jest.fn().mockResolvedValue(createdUser);

      // Act
      const result = await repository.createWithOAuth(userData, oauthData);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@gmail.com',
          firstName: 'Jane',
          passwordHash: null,
          oauthProviders: {
            create: oauthData,
          },
        },
        include: {
          oauthProviders: true,
        },
      });
      expect(result.email).toBe('newuser@gmail.com');
      expect((result as any).oauthProviders).toHaveLength(1);
      expect((result as any).oauthProviders[0].provider).toBe('google');
    });

    it('should create user with null passwordHash for OAuth-only users', async () => {
      // Arrange
      const userData = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        passwordHash: null, // OAuth-only user
      };
      const oauthData = {
        provider: 'apple',
        providerId: 'apple-123',
        email: 'oauth@example.com',
      };
      const createdUser = {
        ...mockUser,
        ...userData,
        oauthProviders: [{ ...mockOAuthProvider, ...oauthData }],
      };
      prisma.user.create = jest.fn().mockResolvedValue(createdUser);

      // Act
      const result = await repository.createWithOAuth(userData, oauthData);

      // Assert
      expect(result.passwordHash).toBeNull();
      expect((result as any).oauthProviders[0].provider).toBe('apple');
    });

    it('should create OAuthProvider record linked to new user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        passwordHash: null,
      };
      const oauthData = {
        provider: 'google',
        providerId: 'google-test',
        email: 'test@example.com',
      };
      const createdUser = {
        ...mockUser,
        oauthProviders: [mockOAuthProvider],
      };
      prisma.user.create = jest.fn().mockResolvedValue(createdUser);

      // Act
      await repository.createWithOAuth(userData, oauthData);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oauthProviders: {
              create: oauthData,
            },
          }),
        }),
      );
    });
  });

  describe('linkOAuthProvider', () => {
    it('should link OAuth provider to existing user', async () => {
      // Arrange
      const userId = 'uuid-existing';
      const oauthData = {
        provider: 'google',
        providerId: 'google-link-123',
        email: 'existing@example.com',
      };
      prisma.oAuthProvider.create = jest.fn().mockResolvedValue(mockOAuthProvider);

      // Act
      await repository.linkOAuthProvider(userId, oauthData);

      // Assert
      expect(prisma.oAuthProvider.create).toHaveBeenCalledWith({
        data: {
          userId: 'uuid-existing',
          provider: 'google',
          providerId: 'google-link-123',
          email: 'existing@example.com',
        },
      });
    });

    it('should allow linking multiple OAuth providers to same user', async () => {
      // Arrange
      const userId = 'uuid-multi';
      const googleData = {
        provider: 'google',
        providerId: 'google-123',
        email: 'user@example.com',
      };
      const appleData = {
        provider: 'apple',
        providerId: 'apple-456',
        email: 'user@example.com',
      };
      prisma.oAuthProvider.create = jest.fn().mockResolvedValue(mockOAuthProvider);

      // Act
      await repository.linkOAuthProvider(userId, googleData);
      await repository.linkOAuthProvider(userId, appleData);

      // Assert
      expect(prisma.oAuthProvider.create).toHaveBeenCalledTimes(2);
      expect(prisma.oAuthProvider.create).toHaveBeenNthCalledWith(1, {
        data: { userId, ...googleData },
      });
      expect(prisma.oAuthProvider.create).toHaveBeenNthCalledWith(2, {
        data: { userId, ...appleData },
      });
    });

    it('should not return value (void)', async () => {
      // Arrange
      const userId = 'uuid-test';
      const oauthData = {
        provider: 'google',
        providerId: 'google-test',
        email: 'test@example.com',
      };
      prisma.oAuthProvider.create = jest.fn().mockResolvedValue(mockOAuthProvider);

      // Act
      const result = await repository.linkOAuthProvider(userId, oauthData);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
