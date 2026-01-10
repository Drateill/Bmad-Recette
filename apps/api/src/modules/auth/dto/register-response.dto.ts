export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  createdAt: Date;
}

export interface RegisterResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}
