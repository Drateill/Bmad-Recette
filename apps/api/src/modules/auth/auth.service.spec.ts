import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as passwordUtil from './utils/password.util';
import * as jwtUtil from './utils/jwt.util';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let configService: jest.Mocked<ConfigService>;
  let mockRedisClient: any;

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSyncedAt: new Date('2024-01-01'),
  };

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
              const config: Record<string, string> = {
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
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Spy on utility functions
    jest.spyOn(passwordUtil, 'hashPassword').mockResolvedValue('$2b$10$hashedpassword');
    jest.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue('mock-access-token');
    jest.spyOn(jwtUtil, 'generateRefreshToken').mockReturnValue({
      token: 'mock-refresh-token',
      tokenId: 'mock-token-id',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Password123',
      firstName: 'Jane',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(authRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        firstName: registerDto.firstName,
        passwordHash: '$2b$10$hashedpassword',
      });
      expect(jwtUtil.generateAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        'test-secret',
        '15m',
      );
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'test-refresh-secret',
        '7d',
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}:mock-token-id`,
        604800, // 7 days in seconds
        expect.stringContaining(mockUser.id),
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          createdAt: mockUser.createdAt,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
      expect(authRepository.create).not.toHaveBeenCalled();
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(registerDto.password);
      const createCall = authRepository.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe(registerDto.password);
      expect(createCall.passwordHash).toBe('$2b$10$hashedpassword');
    });

    it('should generate both access and refresh tokens', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should store refresh token in Redis with correct TTL', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}:mock-token-id`,
        604800, // 7 days = 7 * 24 * 60 * 60 seconds
        expect.stringContaining(mockUser.id),
      );
    });

    it('should not return passwordHash in response', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('createdAt');
    });

    it('should use configuration values for JWT', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
      expect(configService.get).toHaveBeenCalledWith('jwt.accessTokenExpiration');
      expect(configService.get).toHaveBeenCalledWith('jwt.refreshTokenExpiration');
      expect(jwtUtil.generateAccessToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'test-secret',
        '15m',
      );
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalledWith(
        expect.any(String),
        'test-refresh-secret',
        '7d',
      );
    });

    it('should handle missing config gracefully with defaults', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);
      configService.get.mockReturnValue(undefined);

      // Act
      await service.register(registerDto);

      // Assert - Should use default values
      expect(jwtUtil.generateAccessToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'development-secret-change-in-production',
        '15m',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUserWithPassword = {
      ...mockUser,
      passwordHash: '$2b$10$hashedpassword',
    };

    beforeEach(() => {
      jest.spyOn(passwordUtil, 'comparePassword');
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto, '192.168.1.1');

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(passwordUtil.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUserWithPassword.passwordHash,
      );
      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}:mock-token-id`,
        604800,
        expect.stringContaining(mockUser.id),
      );
    });

    it('should perform case-insensitive email lookup', async () => {
      // Arrange
      const uppercaseLoginDto = { ...loginDto, email: 'TEST@EXAMPLE.COM' };
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      await service.login(uppercaseLoginDto, '192.168.1.1');

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for OAuth-only user (null passwordHash)', async () => {
      // Arrange
      const oauthUser = { ...mockUser, passwordHash: null };
      authRepository.findByEmail.mockResolvedValue(oauthUser);

      // Act & Assert
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should store refresh token in Redis with correct TTL', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      await service.login(loginDto, '192.168.1.1');

      // Assert
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}:mock-token-id`,
        604800, // 7 days in seconds
        expect.stringContaining(mockUser.id),
      );
    });

    it('should not return passwordHash in response', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto, '192.168.1.1');

      // Assert
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('createdAt');
    });

    it('should log successful login with IP address', async () => {
      // Arrange
      const logSpy = jest.spyOn(service['logger'], 'log');
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      await service.login(loginDto, '192.168.1.1');

      // Assert
      expect(logSpy).toHaveBeenCalledWith({
        event: 'login_success',
        userId: mockUser.id,
        email: mockUser.email,
        ip: '192.168.1.1',
        timestamp: expect.any(String),
      });
    });

    it('should log failed login attempt for non-existent user', async () => {
      // Arrange
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      authRepository.findByEmail.mockResolvedValue(null);

      // Act
      try {
        await service.login(loginDto, '192.168.1.1');
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(warnSpy).toHaveBeenCalledWith({
        event: 'login_failed',
        email: loginDto.email,
        ip: '192.168.1.1',
        reason: 'invalid_credentials',
        timestamp: expect.any(String),
      });
    });

    it('should log failed login attempt for incorrect password', async () => {
      // Arrange
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act
      try {
        await service.login(loginDto, '192.168.1.1');
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(warnSpy).toHaveBeenCalledWith({
        event: 'login_failed',
        email: loginDto.email,
        ip: '192.168.1.1',
        reason: 'invalid_credentials',
        timestamp: expect.any(String),
      });
    });

    it('should log failed login attempt for OAuth-only user', async () => {
      // Arrange
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      const oauthUser = { ...mockUser, passwordHash: null };
      authRepository.findByEmail.mockResolvedValue(oauthUser);

      // Act
      try {
        await service.login(loginDto, '192.168.1.1');
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(warnSpy).toHaveBeenCalledWith({
        event: 'login_failed',
        email: loginDto.email,
        ip: '192.168.1.1',
        reason: 'oauth_only_user',
        timestamp: expect.any(String),
      });
    });

    it('should default to "unknown" IP if not provided', async () => {
      // Arrange
      const logSpy = jest.spyOn(service['logger'], 'log');
      authRepository.findByEmail.mockResolvedValue(mockUserWithPassword);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      await service.login(loginDto); // No IP provided

      // Assert
      expect(logSpy).toHaveBeenCalledWith({
        event: 'login_success',
        userId: mockUser.id,
        email: mockUser.email,
        ip: 'unknown',
        timestamp: expect.any(String),
      });
    });
  });

  describe('refreshAccessToken', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: 'uuid-123',
      jti: 'token-id-123',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 604800,
    };

    it('should refresh access token successfully with valid refresh token', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValueOnce(null); // oldTokenKey not found
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ userId: mockPayload.sub, tokenId: mockPayload.jti })); // current token found
      authRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshAccessToken(mockRefreshToken);

      // Assert
      expect(service['jwtService'].verify).toHaveBeenCalledWith(mockRefreshToken, { secret: 'test-refresh-secret' });
      expect(mockRedisClient.get).toHaveBeenCalledWith(`refresh_token_old:${mockPayload.sub}:${mockPayload.jti}`);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`refresh_token:${mockPayload.sub}:${mockPayload.jti}`);
      expect(authRepository.findById).toHaveBeenCalledWith(mockPayload.sub);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should return cached response for concurrent requests within idempotency window', async () => {
      // Arrange
      const cachedResponse = JSON.stringify({ accessToken: 'cached-access-token', refreshToken: 'cached-refresh-token' });
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValueOnce(cachedResponse); // oldTokenKey found (idempotent)

      // Act
      const result = await service.refreshAccessToken(mockRefreshToken);

      // Assert
      expect(result.accessToken).toBe('cached-access-token');
      expect(result.refreshToken).toBe('cached-refresh-token');
      expect(mockRedisClient.get).toHaveBeenCalledTimes(1); // Only checked old token key
      expect(authRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid JWT signature', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act & Assert
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act & Assert
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token not found in Redis', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValue(null); // Both old and current token not found

      // Act & Assert
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException if token missing jti claim', async () => {
      // Arrange
      const payloadWithoutJti = { sub: 'uuid-123', email: 'test@example.com' };
      (service['jwtService'].verify as jest.Mock).mockReturnValue(payloadWithoutJti);

      // Act & Assert
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValueOnce(null); // oldTokenKey not found
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ userId: mockPayload.sub })); // current token found
      authRepository.findById.mockResolvedValue(null); // User not found

      // Act & Assert - Single call to avoid double mock consumption
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('User not found');
    });

    it('should implement token rotation by generating new refresh token', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValueOnce(null); // oldTokenKey not found
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ userId: mockPayload.sub })); // current token found
      authRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshAccessToken(mockRefreshToken);

      // Assert
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalled();
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}:mock-token-id`,
        604800,
        expect.any(String),
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(`refresh_token:${mockPayload.sub}:${mockPayload.jti}`);
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should store old token in Redis with 5-second TTL for idempotency', async () => {
      // Arrange
      (service['jwtService'].verify as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.get.mockResolvedValueOnce(null); // oldTokenKey not found
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ userId: mockPayload.sub })); // current token found
      authRepository.findById.mockResolvedValue(mockUser);

      // Act
      await service.refreshAccessToken(mockRefreshToken);

      // Assert
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `refresh_token_old:${mockPayload.sub}:${mockPayload.jti}`,
        5,
        expect.stringContaining('mock-access-token'),
      );
    });
  });

  describe('logout', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: 'uuid-123',
      jti: 'token-id-123',
    };

    it('should successfully logout and invalidate refresh token', async () => {
      // Arrange
      (service['jwtService'].decode as jest.Mock).mockReturnValue(mockPayload);

      // Act
      await service.logout(mockRefreshToken);

      // Assert
      expect(service['jwtService'].decode).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockRedisClient.del).toHaveBeenCalledWith(`refresh_token:${mockPayload.sub}:${mockPayload.jti}`);
    });

    it('should handle missing token gracefully without throwing', async () => {
      // Arrange
      (service['jwtService'].decode as jest.Mock).mockReturnValue(null);

      // Act & Assert - Should not throw
      await expect(service.logout(mockRefreshToken)).resolves.not.toThrow();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle token without userId gracefully', async () => {
      // Arrange
      const invalidPayload = { jti: 'token-id-123' }; // Missing sub
      (service['jwtService'].decode as jest.Mock).mockReturnValue(invalidPayload);

      // Act & Assert - Should not throw
      await expect(service.logout(mockRefreshToken)).resolves.not.toThrow();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle token without jti gracefully', async () => {
      // Arrange
      const invalidPayload = { sub: 'uuid-123' }; // Missing jti
      (service['jwtService'].decode as jest.Mock).mockReturnValue(invalidPayload);

      // Act & Assert - Should not throw
      await expect(service.logout(mockRefreshToken)).resolves.not.toThrow();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle Redis connection failure gracefully', async () => {
      // Arrange
      (service['jwtService'].decode as jest.Mock).mockReturnValue(mockPayload);
      mockRedisClient.del.mockRejectedValue(new Error('Redis connection failed'));

      // Act & Assert - Should not throw
      await expect(service.logout(mockRefreshToken)).resolves.not.toThrow();
    });

    it('should log successful logout', async () => {
      // Arrange
      const logSpy = jest.spyOn(service['logger'], 'log');
      (service['jwtService'].decode as jest.Mock).mockReturnValue(mockPayload);

      // Act
      await service.logout(mockRefreshToken);

      // Assert
      expect(logSpy).toHaveBeenCalledWith({
        event: 'user_logged_out',
        userId: mockPayload.sub,
        tokenId: mockPayload.jti,
        timestamp: expect.any(String),
      });
    });

    it('should log errors but not throw on failure', async () => {
      // Arrange
      const errorSpy = jest.spyOn(service['logger'], 'error');
      (service['jwtService'].decode as jest.Mock).mockImplementation(() => {
        throw new Error('Decode failed');
      });

      // Act
      await service.logout(mockRefreshToken);

      // Assert
      expect(errorSpy).toHaveBeenCalledWith({
        event: 'logout_error',
        error: 'Decode failed',
        timestamp: expect.any(String),
      });
    });
  });
});
