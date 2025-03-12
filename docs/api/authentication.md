# Authentication API

This document describes the authentication endpoints and their authorization requirements.

## Authentication Flow

CodeDefender uses JWT tokens for authentication. The authentication flow is:

1. User submits credentials to obtain a token
2. The token is included in subsequent requests as a Bearer token
3. Tokens expire after a configured period and must be refreshed

## Endpoints

### Register

```
POST /api/auth/register
Register a new user

Request Body:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response:
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe"
}

Authorization:
- Permission: None (public endpoint)
- Plan Feature: None
- Usage Limit: None
```

### Login

```
POST /api/auth/login
Authenticate and receive token

Request Body:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}

Authorization:
- Permission: None (public endpoint)
- Plan Feature: None
- Usage Limit: None
```

### Refresh Token

```
POST /api/auth/refresh
Refresh an expired token

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}

Authorization:
- Permission: None (requires valid refresh token)
- Plan Feature: None
- Usage Limit: None
```

### Logout

```
POST /api/auth/logout
Invalidate the current session

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true
}

Authorization:
- Permission: None (requires authentication)
- Plan Feature: None
- Usage Limit: None
```

### Get Current User

```
GET /api/auth/me
Get the current authenticated user's information

Response:
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": [
    {
      "id": "role-uuid",
      "name": "Workspace Owner",
      "workspaceId": "workspace-uuid"
    }
  ]
}

Authorization:
- Permission: None (requires authentication)
- Plan Feature: None
- Usage Limit: None
```

### Two-Factor Authentication Setup

```
POST /api/auth/2fa/setup
Set up two-factor authentication for the account

Request Body:
{
  "type": "totp" // or "sms"
}

Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}

Authorization:
- Permission: None (requires authentication)
- Plan Feature: SSO_LOGIN (BUSINESS plan or higher)
- Usage Limit: None
```

### Verify Two-Factor Authentication

```
POST /api/auth/2fa/verify
Verify a two-factor authentication code

Request Body:
{
  "code": "123456"
}

Response:
{
  "success": true
}

Authorization:
- Permission: None (requires authentication)
- Plan Feature: SSO_LOGIN (BUSINESS plan or higher)
- Usage Limit: None
```

### Password Reset Request

```
POST /api/auth/password-reset
Request a password reset email

Request Body:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}

Authorization:
- Permission: None (public endpoint)
- Plan Feature: None
- Usage Limit: None
```

### Password Reset Confirmation

```
POST /api/auth/password-reset/confirm
Reset password using the token from email

Request Body:
{
  "token": "reset-token",
  "password": "newSecurePassword123"
}

Response:
{
  "success": true
}

Authorization:
- Permission: None (requires valid reset token)
- Plan Feature: None
- Usage Limit: None
```

## Error Responses

### Authentication Failed

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Token Expired

```json
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

### Rate Limited

```json
{
  "statusCode": 429,
  "message": "Too many login attempts, please try again later",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

## Security Considerations

1. All authentication endpoints log security events to the audit trail
2. Failed login attempts are rate-limited to prevent brute force attacks
3. Two-factor authentication is available for enhanced security
4. Password requirements enforce strong security standards
5. Account lockout occurs after multiple failed attempts
