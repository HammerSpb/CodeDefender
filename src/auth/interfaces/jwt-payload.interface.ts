export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ownerId?: string | null;
  plan?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}
