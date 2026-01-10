import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'development-secret-change-in-production',
    });
  }

  /**
   * Validate JWT payload and return user object
   * This method is called automatically by Passport after JWT verification
   * @param payload - Decoded JWT payload { sub: userId, email: string, type: 'access' }
   */
  async validate(payload: any) {
    // Verify this is an access token (not refresh token)
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Look up user by ID from token payload
    const user = await this.authRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user object (will be attached to request.user)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    };
  }
}
