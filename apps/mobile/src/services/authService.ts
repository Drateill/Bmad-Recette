import apiClient from './apiClient';
import type { User } from '@bmad/shared/types/auth';
import {
  RegisterResponseSchema,
  LoginResponseSchema,
  GetProfileResponseSchema,
  RefreshTokenResponseSchema,
} from '@bmad/shared/schemas/apiSchemas';

/**
 * Authentication API Service for Mobile
 * Handles all authentication-related API calls
 */

export interface AuthTokens {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  firstName: string
): Promise<AuthTokens> {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    firstName,
  });

  // Validate response with Zod
  const validatedData = RegisterResponseSchema.parse(response.data);

  return {
    user: {
      ...validatedData.user,
      updatedAt: validatedData.user.createdAt,
      lastSyncedAt: validatedData.user.createdAt,
    },
    accessToken: validatedData.accessToken,
    refreshToken: validatedData.refreshToken,
  };
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<AuthTokens> {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  // Validate response with Zod
  const validatedData = LoginResponseSchema.parse(response.data);

  return {
    user: {
      ...validatedData.user,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    },
    accessToken: validatedData.accessToken,
    refreshToken: validatedData.refreshToken,
  };
}

/**
 * Logout - invalidate refresh token on server
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string }> {
  const response = await apiClient.post('/auth/refresh', { refreshToken });

  // Validate response with Zod
  const validatedData = RefreshTokenResponseSchema.parse(response.data);

  return { accessToken: validatedData.accessToken };
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeOAuthCode(
  provider: 'google' | 'apple',
  code: string
): Promise<AuthTokens> {
  const response = await apiClient.post(`/auth/${provider}/callback`, {
    code,
  });

  // Validate response with Zod
  const validatedData = LoginResponseSchema.parse(response.data);

  return {
    user: {
      ...validatedData.user,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    },
    accessToken: validatedData.accessToken,
    refreshToken: validatedData.refreshToken,
  };
}

/**
 * Get current user profile (for auth restoration)
 */
export async function getProfile(): Promise<User> {
  const response = await apiClient.get('/auth/me');

  // Validate response with Zod
  const validatedData = GetProfileResponseSchema.parse(response.data);

  return validatedData.user;
}
