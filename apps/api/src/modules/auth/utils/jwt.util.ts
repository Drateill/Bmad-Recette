import { sign } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../../types/auth.types';

/**
 * Generate an access token JWT
 * @param userId - The user's ID
 * @param email - The user's email
 * @param secret - JWT secret from config
 * @param expiresIn - Token expiration time (e.g., '15m')
 * @returns JWT access token string
 */
export function generateAccessToken(
  userId: string,
  email: string,
  secret: string,
  expiresIn: string = '15m',
): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    type: 'access',
  };

  return sign(payload, secret, { expiresIn } as any);
}

/**
 * Generate a refresh token JWT
 * @param userId - The user's ID
 * @param secret - JWT secret from config
 * @param expiresIn - Token expiration time (e.g., '7d')
 * @returns Object with JWT refresh token string and token ID
 */
export function generateRefreshToken(
  userId: string,
  secret: string,
  expiresIn: string = '7d',
): { token: string; tokenId: string } {
  const tokenId = randomUUID();
  const payload: Omit<JwtPayload, 'iat' | 'exp' | 'email'> = {
    sub: userId,
    type: 'refresh',
    jti: tokenId,
  };

  const token = sign(payload, secret, { expiresIn } as any);
  return { token, tokenId };
}
