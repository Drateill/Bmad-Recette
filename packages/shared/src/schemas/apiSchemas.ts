import { z } from 'zod';

/**
 * Zod schemas for API response validation
 * Ensures runtime type safety for data from backend
 */

/**
 * User schema for API responses
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastSyncedAt: z.coerce.date(),
});

/**
 * Auth response schemas
 */
export const RegisterResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
    createdAt: z.coerce.date(),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const GetProfileResponseSchema = z.object({
  user: UserSchema,
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
});
