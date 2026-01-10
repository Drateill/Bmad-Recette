export interface LoginResponseDto {
  user: {
    id: string;
    email: string;
    firstName: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
