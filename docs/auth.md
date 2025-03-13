# Authentication System

CodeDefender uses a modern JWT-based authentication system with refresh tokens for secure API access.

## Authentication Flow

1. **Login / Registration**: User provides credentials and receives both access token and refresh token
2. **API Access**: Access token is used for API requests as a Bearer token
3. **Token Refresh**: When access token expires, refresh token is used to obtain a new access token
4. **Logout**: Refresh token is revoked, invalidating the session

## Tokens

- **Access Token**: Short-lived JWT token (15 minutes by default)
- **Refresh Token**: Long-lived JWT token (7 days by default) with server-side tracking

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate and receive tokens
- `POST /api/v1/auth/refresh` - Get new access token using refresh token
- `POST /api/v1/auth/logout` - Revoke current refresh token
- `DELETE /api/v1/auth/sessions` - Revoke all refresh tokens (logout from all devices)

### Session Management

- `GET /api/v1/auth/sessions` - List all active sessions

### OAuth Authentication

- `GET /api/v1/auth/oauth/github` - Initiate GitHub OAuth flow
- `GET /api/v1/auth/oauth/github/callback` - Handle GitHub OAuth callback

## Security Measures

- Strong password validation for registration (requires uppercase, lowercase, numbers, special chars)
- Rate limiting for login/register endpoints (5 attempts per minute per IP)
- Enhanced error handling with standardized responses
- Refresh tokens are stored in the database with additional metadata
- Sessions track IP address, user agent, and device fingerprint
- Tokens have short expiration times to limit the impact of token theft
- Server-side token revocation allows immediate termination of sessions
- Audit logging tracks all authentication activities
- Brute force protection via rate limiting

## OAuth Integration

CodeDefender supports authentication via OAuth providers:

1. **GitHub**: Authenticate with your GitHub account
   - Requests access to basic profile info and repository data
   - Links accounts with matching email addresses
   - Creates a new account if email doesn't exist

OAuth scopes requested:
- `user:email` - To access user email
- `repo` - To access repository data for security scanning

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

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000
```

## Best Practices

- Keep refresh tokens secure - they provide long-term access
- Implement frontend auto-refresh before access token expiration
- Include proper error handling for token expiration
- Use HTTPS in all environments to protect token transmission
