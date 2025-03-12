# CodeDefender Documentation

This directory contains comprehensive documentation for the CodeDefender application.

## Table of Contents

### Authorization
- [Permission System](authorization/permissions.md) - Role-based access control and plan-based features
- [Auth Fixes March 2025](fixes/auth-fix-march2025.md) - Recent fixes to the authentication system

### Database
- [Seeding](database/seeds.md) - Database seed system and data population

### Development
- [Commands](development/commands.md) - Development scripts and workflows

### Fixes & Updates
- [Auth System Fixes (March 2025)](fixes/auth-fix-march2025.md) - Fixes for the authentication and authorization system

## Development Guidelines

When extending or modifying CodeDefender:

1. Update relevant documentation when making code changes
2. Follow the established patterns for permissions and features
3. Use the centralized constants for permissions rather than hardcoded strings
4. Test authorization rules thoroughly
5. Keep documentation in sync with code

## Additional Resources

- External documentation: [docs.codedefender.com](https://docs.codedefender.com)
- API Reference: `/api/docs` (Swagger UI)
