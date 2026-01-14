import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { hashPassword, comparePassword } from './utils/password.util';
import { generateAccessToken, generateRefreshToken } from './utils/jwt.util';
import { JwtPayload } from '../../types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate JWT tokens and store refresh token in Redis
   * @param userId - User ID
   * @param email - User email
   * @returns Object containing accessToken and refreshToken
   * @private
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtSecret =
      this.configService.get<string>('jwt.secret') ||
      'development-secret-change-in-production';
    const jwtRefreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || jwtSecret;
    const accessTokenExpiration =
      this.configService.get<string>('jwt.accessTokenExpiration') || '15m';
    const refreshTokenExpiration =
      this.configService.get<string>('jwt.refreshTokenExpiration') || '7d';

    const accessToken = generateAccessToken(
      userId,
      email,
      jwtSecret,
      accessTokenExpiration,
    );
    const { token: refreshToken, tokenId } = generateRefreshToken(
      userId,
      jwtRefreshSecret,
      refreshTokenExpiration,
    );

    // Store refresh token in Redis with 7-day TTL
    // Key pattern: refresh_token:${userId}:${tokenId}
    await this.storeRefreshToken(userId, tokenId);

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token metadata in Redis
   * @param userId - User ID
   * @param tokenId - Token ID (jti claim)
   * @private
   */
  private async storeRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<void> {
    const redisClient = this.redisService.getClient();
    const key = `refresh_token:${userId}:${tokenId}`;
    const value = JSON.stringify({
      userId,
      tokenId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await redisClient.setex(key, ttl, value);
  }

  /**
   * Format user response (excluding sensitive fields)
   * @param user - User object from database
   * @returns Sanitized user object
   * @private
   */
  private formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      createdAt: user.createdAt,
    };
  }

  /**
   * Register a new user with email and password
   * @param dto - Registration data (email, password, firstName)
   * @returns User object with access and refresh tokens
   * @throws ConflictException if email already exists
   */
  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    // Check if email already exists
    const existingUser = await this.authRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password
    const passwordHash = await hashPassword(dto.password);

    // Create the user
    const user = await this.authRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      passwordHash,
    });

    this.logger.log(`User registered successfully: ${user.email}`);

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    // Return response (excluding passwordHash)
    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   * @param dto - Login data (email, password)
   * @param ip - Optional IP address for logging
   * @returns User object with access and refresh tokens
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(dto: LoginDto, ip?: string): Promise<LoginResponseDto> {
    // Lookup user by email (case-insensitive)
    const user = await this.authRepository.findByEmail(dto.email);

    // If user not found, throw generic error
    if (!user) {
      this.logger.warn({
        event: 'login_failed',
        email: dto.email,
        ip: ip || 'unknown',
        reason: 'invalid_credentials',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // If user exists but passwordHash is null (OAuth-only user)
    if (!user.passwordHash) {
      this.logger.warn({
        event: 'login_failed',
        email: dto.email,
        ip: ip || 'unknown',
        reason: 'oauth_only_user',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn({
        event: 'login_failed',
        email: dto.email,
        ip: ip || 'unknown',
        reason: 'invalid_credentials',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );

    // Log successful login
    this.logger.log({
      event: 'login_success',
      userId: user.id,
      email: user.email,
      ip: ip || 'unknown',
      timestamp: new Date().toISOString(),
    });

    // Return response (excluding passwordHash)
    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Handle OAuth login (Google or Apple)
   * Creates new user, links to existing user, or retrieves existing OAuth user
   * @param oauthPayload - OAuth profile data from strategy
   * @returns User object with access and refresh tokens
   * @throws BadRequestException if email is missing
   */
  async handleOAuthLogin(oauthPayload: {
    provider: string;
    providerId: string;
    email: string | null;
    firstName: string;
  }): Promise<LoginResponseDto> {
    const { provider, providerId, email, firstName } = oauthPayload;

    // Step 1: Check if OAuth provider already linked
    // Important: Check this BEFORE email validation to handle Apple subsequent logins
    const user = await this.authRepository.findByOAuthProvider(
      provider,
      providerId,
    );

    if (user) {
      // Existing OAuth user - generate tokens and return
      this.logger.log({
        event: 'oauth_login_success',
        provider,
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
      );

      return {
        user: this.formatUserResponse(user),
        accessToken,
        refreshToken,
      };
    }

    // Step 2: Check if email is provided (required for account creation/linking)
    // If email is missing and we didn't find existing OAuth user, we can't proceed
    if (!email) {
      throw new BadRequestException('Email required for account creation');
    }

    // Step 3: Check if email exists (account linking scenario)
    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser) {
      // Link OAuth provider to existing account
      await this.authRepository.linkOAuthProvider(existingUser.id, {
        provider,
        providerId,
        email,
      });

      this.logger.log({
        event: 'oauth_linked',
        provider,
        userId: existingUser.id,
        email,
        timestamp: new Date().toISOString(),
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        existingUser.id,
        existingUser.email,
      );

      return {
        user: this.formatUserResponse(existingUser),
        accessToken,
        refreshToken,
      };
    }

    // Step 4: Create new user with OAuth provider
    const newUser = await this.authRepository.createWithOAuth(
      {
        email,
        firstName,
        passwordHash: null, // OAuth-only users have no password
      },
      {
        provider,
        providerId,
        email,
      },
    );

    this.logger.log({
      event: 'oauth_user_created',
      provider,
      userId: newUser.id,
      email,
      timestamp: new Date().toISOString(),
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      newUser.id,
      newUser.email,
    );

    return {
      user: this.formatUserResponse(newUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation with 5-second idempotency window for concurrent requests
   * @param refreshToken - Refresh token from httpOnly cookie
   * @returns New access token and optionally new refresh token
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    // Verify JWT signature and expiration
    let payload: JwtPayload;
    try {
      const jwtRefreshSecret =
        this.configService.get<string>('jwt.refreshSecret') ||
        this.configService.get<string>('jwt.secret') ||
        'development-secret-change-in-production';

      payload = this.jwtService.verify(refreshToken, { secret: jwtRefreshSecret }) as JwtPayload;
    } catch (error) {
      this.logger.warn({
        event: 'refresh_token_invalid',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const redisClient = this.redisService.getClient();
    const key = `refresh_token:${userId}:${tokenId}`;
    const oldTokenKey = `refresh_token_old:${userId}:${tokenId}`;

    // Check if this is an old token within idempotency window (5 seconds)
    const cachedResponse = await redisClient.get(oldTokenKey);
    if (cachedResponse) {
      // Return cached access token for idempotency
      const cached = JSON.parse(cachedResponse);
      this.logger.log({
        event: 'token_refresh_idempotent',
        userId,
        tokenId,
        timestamp: new Date().toISOString(),
      });
      return { accessToken: cached.accessToken, refreshToken: cached.refreshToken };
    }

    // Check if token exists in Redis (current valid token)
    const storedToken = await redisClient.get(key);

    if (!storedToken) {
      this.logger.warn({
        event: 'refresh_token_not_found',
        userId,
        tokenId,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user email for access token generation
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const jwtSecret =
      this.configService.get<string>('jwt.secret') ||
      'development-secret-change-in-production';
    const jwtRefreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || jwtSecret;
    const accessTokenExpiration =
      this.configService.get<string>('jwt.accessTokenExpiration') || '15m';
    const refreshTokenExpiration =
      this.configService.get<string>('jwt.refreshTokenExpiration') || '7d';

    const accessToken = generateAccessToken(
      userId,
      user.email,
      jwtSecret,
      accessTokenExpiration,
    );

    // Implement token rotation: generate new refresh token
    const { token: newRefreshToken, tokenId: newTokenId } = generateRefreshToken(
      userId,
      jwtRefreshSecret,
      refreshTokenExpiration,
    );

    // Store new refresh token in Redis
    await this.storeRefreshToken(userId, newTokenId);

    // Invalidate old refresh token
    await redisClient.del(key);

    // Keep old token valid for 5 seconds (idempotency window)
    // Store the response in case of concurrent requests
    await redisClient.setex(
      oldTokenKey,
      5,
      JSON.stringify({ accessToken, refreshToken: newRefreshToken }),
    );

    this.logger.log({
      event: 'token_refreshed',
      userId,
      oldTokenId: tokenId,
      newTokenId,
      timestamp: new Date().toISOString(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user by invalidating refresh token
   * @param refreshToken - Refresh token from httpOnly cookie
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Decode token (don't verify, just extract userId and tokenId)
      const payload = this.jwtService.decode(refreshToken) as JwtPayload;

      if (payload && payload.sub && payload.jti) {
        const key = `refresh_token:${payload.sub}:${payload.jti}`;
        const redisClient = this.redisService.getClient();
        await redisClient.del(key);

        this.logger.log({
          event: 'user_logged_out',
          userId: payload.sub,
          tokenId: payload.jti,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed from user perspective
      this.logger.error({
        event: 'logout_error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Development-only login method for E2E testing
   * Generates a JWT token for any user by email without password verification
   * @param email - User email
   * @returns User object with access token
   * @throws UnauthorizedException if user not found
   */
  async devLogin(email: string): Promise<{ user: any; accessToken: string }> {
    // Find user by email
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate only access token (no refresh token needed for E2E tests)
    const jwtSecret =
      this.configService.get<string>('jwt.secret') ||
      'development-secret-change-in-production';
    const accessTokenExpiration =
      this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    const accessToken = generateAccessToken(
      user.id,
      user.email,
      jwtSecret,
      accessTokenExpiration,
    );

    this.logger.log({
      event: 'dev_login_success',
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return {
      user: this.formatUserResponse(user),
      accessToken,
    };
  }
}
