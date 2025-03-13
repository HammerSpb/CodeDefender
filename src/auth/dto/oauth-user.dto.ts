export interface OAuthUserDto {
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accessToken: string;
  refreshToken?: string;
}
