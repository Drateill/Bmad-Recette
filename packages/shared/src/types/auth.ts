/**
 * Authentication and Authorization Types
 * Shared between frontend and backend
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;      // userId
  email?: string;   // Only in access token
  type: 'access' | 'refresh';
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}

/**
 * OAuth Provider Types
 */
export interface OAuthProvider {
  id: string;
  userId: string;
  provider: 'google' | 'apple';
  providerId: string;
  email: string;
  linkedAt: Date;
}

export interface OAuthPayload {
  provider: 'google' | 'apple';
  providerId: string;
  email: string | null;
  firstName: string;
}
