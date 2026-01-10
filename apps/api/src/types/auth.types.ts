/**
 * Local authentication types for API
 * Separate from shared package to avoid TypeScript compilation issues
 */

export interface JwtPayload {
  sub: string;      // userId
  email?: string;   // Only in access token
  type: 'access' | 'refresh';
  jti?: string;     // JWT ID (unique token identifier)
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}
