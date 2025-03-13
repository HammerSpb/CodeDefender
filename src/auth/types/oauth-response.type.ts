export interface OAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  isNewUser: boolean;
  workspace?: any;
}
