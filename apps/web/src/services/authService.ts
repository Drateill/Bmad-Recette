import apiClient from './apiClient';
import type { User, LoginResponse, RegisterResponse } from '@bmad/shared/types/auth';

interface RefreshResponse {
  accessToken: string;
}

export async function register(
  email: string,
  password: string,
  firstName: string
): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>('/api/auth/register', {
      email,
      password,
      firstName,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Email already registered. Please sign in instead.');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Unable to connect. Please check your connection.');
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    }
    if (error.response?.status === 429) {
      throw new Error('Too many login attempts. Please try again in 10 minutes.');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Unable to connect. Please check your connection.');
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    // Ignore logout errors, still clear local state
    console.error('Logout error:', error);
  }
}

export async function refreshAccessToken(): Promise<RefreshResponse> {
  try {
    const response = await apiClient.post<RefreshResponse>('/api/auth/refresh');
    return response.data;
  } catch (error: any) {
    throw new Error('Session expired. Please log in again.');
  }
}

export async function getCurrentUser(): Promise<User> {
  try {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to fetch user profile');
  }
}
