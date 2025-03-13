# Authentication System

CodeDefender uses a modern authentication system with multiple authentication methods for secure API access.

## Authentication Methods

1. **Password Authentication**: Traditional email/password login
2. **OAuth Integration**: Authentication via GitHub and other providers
3. **Passwordless Authentication**: Email magic links for password-free login
4. **Session Management**: Track and manage authenticated sessions

## Authentication Flow

1. **Login / Registration**: User authenticates via password, OAuth, or magic link
2. **API Access**: Access token is used for API requests as a Bearer token
3. **Token Refresh**: When access token expires, refresh token is used to obtain a new one
4. **Logout**: Refresh token is revoked, invalidating the session

## API Endpoints

### Password Authentication

- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate with email/password

### Passwordless Authentication

- `POST /api/v1/auth/passwordless/email/initiate` - Request magic link
- `POST /api/v1/auth/passwordless/email/verify` - Verify magic link and authenticate

### OAuth Authentication

- `GET /api/v1/auth/oauth/github` - Initiate GitHub OAuth flow
- `GET /api/v1/auth/oauth/github/callback` - Handle GitHub OAuth callback

### Token Management

- `POST /api/v1/auth/refresh` - Get new access token using refresh token
- `POST /api/v1/auth/logout` - Revoke current refresh token
- `DELETE /api/v1/auth/sessions` - Revoke all refresh tokens (logout from all devices)

### Session Management

- `GET /api/v1/auth/sessions` - List all active sessions

## Security Measures

- **Strong Password Validation**: Requires uppercase, lowercase, numbers, special chars
- **Magic Link Security**: One-time use, short expiration (15 minutes), IP tracking
- **Rate Limiting**: Protection against brute force attacks (5 attempts per minute)
- **Session Tracking**: Monitor devices, IP addresses, and user agents
- **Server-side Token Revocation**: Immediate session invalidation
- **Audit Logging**: Track all authentication activities

## Configuration

Authentication configuration is controlled by environment variables:

```
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# GitHub OAuth credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/github/callback

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## Best Practices

- Keep refresh tokens secure - they provide long-term access
- Implement frontend auto-refresh before access token expiration
- Include proper error handling for token expiration
- Use HTTPS in all environments to protect token transmission
