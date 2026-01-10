import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3001/api/auth/apple/callback',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
