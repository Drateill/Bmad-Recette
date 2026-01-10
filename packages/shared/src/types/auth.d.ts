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
    sub: string;
    email?: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=auth.d.ts.map