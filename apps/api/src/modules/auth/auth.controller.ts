import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Res,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { setRefreshTokenCookie } from './utils/cookie.util';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   * POST /api/auth/register
   * Rate limited: 5 requests per hour
   */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * Login user with email and password
   * POST /api/auth/login
   * Rate limited: 10 requests per hour
   */
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 attempts per hour (3600 seconds = 3600000ms)
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract IP address from request
    const ip = this.extractIpAddress(req);

    // Perform login
    const result = await this.authService.login(dto, ip);

    // Set refresh token in httpOnly cookie
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
    setRefreshTokenCookie(res, result.refreshToken, nodeEnv);

    // Return user and access token (refresh token in cookie, not body)
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Extract IP address from request
   * Handles X-Forwarded-For header for reverse proxy scenarios
   */
  private extractIpAddress(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can be a comma-separated list, take the first IP
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }

  /**
   * Initiate Google OAuth flow
   * GET /api/auth/google
   * Redirects to Google authorization URL
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google, no logic needed here
  }

  /**
   * Google OAuth callback
   * GET /api/auth/google/callback
   * Handles OAuth callback from Google
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    try {
      // Handle OAuth login
      const result = await this.authService.handleOAuthLogin(req.user);

      // Set refresh token in httpOnly cookie
      const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
      setRefreshTokenCookie(res, result.refreshToken, nodeEnv);

      // Redirect to frontend with access token in URL
      const frontendUrl = this.configService.get<string>('oauth.frontendUrl') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/success?token=${result.accessToken}`);
    } catch (error) {
      // Log OAuth error with security context for audit trail
      this.logger.error({
        event: 'oauth_error',
        provider: 'google',
        attemptedEmail: req.user?.email || 'unknown',
        errorType: (error as Error).name || 'UnknownError',
        errorMessage: (error as Error).message || 'OAuth authentication failed',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      // Redirect to frontend with error
      const frontendUrl = this.configService.get<string>('oauth.frontendUrl') || 'http://localhost:5173';
      const errorMessage = encodeURIComponent(
        (error as Error).message || 'OAuth authentication failed'
      );
      res.redirect(`${frontendUrl}/auth/error?error=oauth_failed&message=${errorMessage}`);
    }
  }

  /**
   * Initiate Apple OAuth flow
   * GET /api/auth/apple
   * Redirects to Apple authorization URL
   */
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    // Guard redirects to Apple, no logic needed here
  }

  /**
   * Apple OAuth callback
   * GET /api/auth/apple/callback (POST may also be used by Apple)
   * Handles OAuth callback from Apple
   */
  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    try {
      // Handle OAuth login
      const result = await this.authService.handleOAuthLogin(req.user);

      // Set refresh token in httpOnly cookie
      const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
      setRefreshTokenCookie(res, result.refreshToken, nodeEnv);

      // Redirect to frontend with access token in URL
      const frontendUrl = this.configService.get<string>('oauth.frontendUrl') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/success?token=${result.accessToken}`);
    } catch (error) {
      // Log OAuth error with security context for audit trail
      this.logger.error({
        event: 'oauth_error',
        provider: 'apple',
        attemptedEmail: req.user?.email || 'unknown',
        errorType: (error as Error).name || 'UnknownError',
        errorMessage: (error as Error).message || 'OAuth authentication failed',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      // Redirect to frontend with error
      const frontendUrl = this.configService.get<string>('oauth.frontendUrl') || 'http://localhost:5173';
      const errorMessage = encodeURIComponent(
        (error as Error).message || 'OAuth authentication failed'
      );
      res.redirect(`${frontendUrl}/auth/error?error=oauth_failed&message=${errorMessage}`);
    }
  }

  /**
   * Apple OAuth callback via POST (Apple may use POST)
   * POST /api/auth/apple/callback
   */
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallbackPost(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    // Reuse the same logic as GET callback
    return this.appleAuthCallback(req, res);
  }

  /**
   * Refresh access token using refresh token from httpOnly cookie
   * POST /api/auth/refresh
   * Rate limited: 10 requests per hour
   * Implements token rotation with 5-second idempotency window
   */
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract refresh token from httpOnly cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Generate new access token (and optionally new refresh token with rotation)
    const result = await this.authService.refreshAccessToken(refreshToken);

    // If new refresh token returned (rotation), update cookie
    if (result.refreshToken) {
      const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
      setRefreshTokenCookie(res, result.refreshToken, nodeEnv);
    }

    // Return only access token in response body (refresh token in cookie)
    return { accessToken: result.accessToken };
  }

  /**
   * Logout user by invalidating refresh token
   * POST /api/auth/logout
   * Rate limited: 10 requests per hour
   */
  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract refresh token from httpOnly cookie
    const refreshToken = req.cookies?.refreshToken;

    // Call logout service (graceful handling if token missing)
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear refresh token cookie
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    // Return 204 No Content (handled by @HttpCode decorator)
  }
}
