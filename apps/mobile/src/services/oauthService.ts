import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { exchangeOAuthCode } from './authService';
import type { AuthTokens } from './authService';

// Required for iOS to properly handle auth session completion
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth Configuration
 */
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const APPLE_DISCOVERY = {
  authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
  tokenEndpoint: 'https://appleid.apple.com/auth/token',
};

/**
 * Login with Google OAuth
 */
export async function loginWithGoogle(): Promise<AuthTokens> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'bmadrecette',
    });

    const clientId = Constants.expoConfig?.extra?.googleClientId;

    if (!clientId) {
      throw new Error('Google OAuth client ID not configured');
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    });

    await request.promptAsync(GOOGLE_DISCOVERY);

    if (request.codeVerifier && request.state) {
      const result = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: request.state,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        GOOGLE_DISCOVERY
      );

      // Exchange OAuth code for app tokens via backend
      const tokens = await exchangeOAuthCode('google', result.accessToken || '');
      return tokens;
    }

    throw new Error('OAuth authentication failed');
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw new Error('Failed to authenticate with Google');
  }
}

/**
 * Login with Apple OAuth
 */
export async function loginWithApple(): Promise<AuthTokens> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'bmadrecette',
    });

    const clientId = Constants.expoConfig?.extra?.appleClientId;

    if (!clientId) {
      throw new Error('Apple OAuth client ID not configured');
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['name', 'email'],
      redirectUri,
    });

    await request.promptAsync(APPLE_DISCOVERY);

    if (request.codeVerifier && request.state) {
      const result = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: request.state,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        APPLE_DISCOVERY
      );

      // Exchange OAuth code for app tokens via backend
      const tokens = await exchangeOAuthCode('apple', result.accessToken || '');
      return tokens;
    }

    throw new Error('OAuth authentication failed');
  } catch (error) {
    console.error('Apple OAuth error:', error);
    throw new Error('Failed to authenticate with Apple');
  }
}
