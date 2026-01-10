import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.apple.clientID') as string,
      teamID: configService.get<string>('oauth.apple.teamID') as string,
      keyID: configService.get<string>('oauth.apple.keyID') as string,
      privateKeyString: configService.get<string>('oauth.apple.privateKey') as string,
      callbackURL: configService.get<string>('oauth.apple.callbackURL') as string,
      scope: ['email', 'name'],
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: any,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    // Apple provides email and name only on first authorization
    // On subsequent logins, we'll need to retrieve from our database
    const payload = {
      provider: 'apple',
      providerId: profile.id || idToken.sub,
      email: profile.email || idToken.email || null,
      firstName: profile.name?.firstName || 'User',
    };

    done(null, payload);
  }
}
