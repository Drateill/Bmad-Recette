import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.google.clientID') as string,
      clientSecret: configService.get<string>('oauth.google.clientSecret') as string,
      callbackURL: configService.get<string>('oauth.google.callbackURL') as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name } = profile;

    const payload = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value || null,
      firstName: name?.givenName || 'User',
    };

    done(null, payload);
  }
}
