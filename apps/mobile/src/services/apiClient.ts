import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStorage from '../utils/secureStorage';

/**
 * Mobile API Client Configuration
 * 
 * Key Differences from Web:
 * - withCredentials: false (mobile doesn't use cookies)
 * - Tokens stored in SecureStore (not in-memory)
 * - Refresh token sent in request body (not cookie)
 */

const apiClient = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Add Authorization header from SecureStore
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await SecureStorage.getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle 401 errors and refresh token
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStorage.getRefreshToken();
        
        if (!refreshToken) {
          await SecureStorage.clearTokens();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;

        await SecureStorage.setAccessToken(accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        await SecureStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
