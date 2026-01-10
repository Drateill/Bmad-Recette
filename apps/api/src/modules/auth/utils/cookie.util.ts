import { Response } from 'express';

/**
 * Set refresh token as httpOnly cookie
 * @param res - Express response object
 * @param token - The refresh token JWT
 * @param nodeEnv - Current Node environment (development, production)
 */
export function setRefreshTokenCookie(
  res: Response,
  token: string,
  nodeEnv: string,
): void {
  const isProduction = nodeEnv === 'production';

  res.cookie('refreshToken', token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    path: '/api/auth', // Only sent to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
}
