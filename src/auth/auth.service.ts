import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { Plan, WorkspaceRole } from '@prisma/client';
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { TokensService } from './tokens.service';
import { Request } from 'express';
import { OAuthUserDto } from './dto/oauth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private tokensService: TokensService,
    private prismaService: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto, req?: Request) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      ownerId: user.ownerId,
      plan: user.plan,
    };

    // Generate tokens
    const accessToken = this.tokensService.generateAccessToken(payload);
    const refreshToken = await this.tokensService.generateRefreshToken(
      user.id,
      req?.ip,
      req?.headers['user-agent'],
      req?.headers['x-device-fingerprint'] as string,
    );

    // Log the login action
    await this.auditLogsService.create({
      userId: user.id,
      action: 'USER_LOGIN',
      details: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgName: user.orgName,
        plan: user.plan,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Find or create a user from OAuth provider data
   */
  async findOrCreateOAuthUser(oauthUserDto: OAuthUserDto, req?: Request) {
    const { provider, providerId, email, firstName, lastName, accessToken } = oauthUserDto;

    // First check if we already have this OAuth account linked
    const existingOAuthLink = await this.prismaService.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
      },
    });

    // If we found an existing link, update the OAuth token and return the user
    if (existingOAuthLink) {
      // Log the OAuth login
      await this.auditLogsService.create({
        userId: existingOAuthLink.userId,
        action: 'USER_LOGIN_OAUTH',
        details: {
          provider,
          email,
          timestamp: new Date().toISOString(),
        },
      });

      // Generate tokens
      const payload = {
        email: existingOAuthLink.user.email,
        sub: existingOAuthLink.userId,
        role: existingOAuthLink.user.role,
        ownerId: existingOAuthLink.user.ownerId,
        plan: existingOAuthLink.user.plan,
      };

      const jwtAccessToken = this.tokensService.generateAccessToken(payload);
      const refreshToken = await this.tokensService.generateRefreshToken(
        existingOAuthLink.userId,
        req?.ip,
        req?.headers['user-agent'],
        req?.headers['x-device-fingerprint'] as string,
      );

      return {
        accessToken: jwtAccessToken,
        refreshToken,
        user: existingOAuthLink.user,
        isNewUser: false,
      };
    }

    // Check if the email is already registered
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    // If the email exists but isn't linked to this OAuth account yet
    if (existingUser) {
      // Link the OAuth account to the existing user
      await this.prismaService.oAuthProvider.create({
        data: {
          provider,
          providerId,
          userId: existingUser.id,
        },
      });

      // Log the OAuth link and login
      await this.auditLogsService.create({
        userId: existingUser.id,
        action: 'USER_OAUTH_LINK',
        details: {
          provider,
          email,
          timestamp: new Date().toISOString(),
        },
      });

      // Generate tokens
      const payload = {
        email: existingUser.email,
        sub: existingUser.id,
        role: existingUser.role,
        ownerId: existingUser.ownerId,
        plan: existingUser.plan,
      };

      const jwtAccessToken = this.tokensService.generateAccessToken(payload);
      const refreshToken = await this.tokensService.generateRefreshToken(
        existingUser.id,
        req?.ip,
        req?.headers['user-agent'],
        req?.headers['x-device-fingerprint'] as string,
      );

      return {
        accessToken: jwtAccessToken,
        refreshToken,
        user: existingUser,
        isNewUser: false,
      };
    }

    // If we reach here, we need to create a new user and link the OAuth account
    try {
      const result = await this.prismaService.$transaction(async (prisma) => {
        // Create a new user
        const newUser = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            provider,
            providerId,
            role: 'MEMBER', // Default role
            plan: Plan.STARTER,
          },
        });

        // Create OAuth provider link
        await prisma.oAuthProvider.create({
          data: {
            provider,
            providerId,
            userId: newUser.id,
          },
        });

        // Find default Member role
        const defaultRole = await prisma.role.findUnique({
          where: { name: 'Member' },
        });

        if (defaultRole) {
          // Assign default role
          await prisma.userRoleAssignment.create({
            data: {
              userId: newUser.id,
              roleId: defaultRole.id,
            },
          });
        }

        // Create personal workspace
        const workspaceName = `${firstName || 'GitHub'}'s Workspace`;
        const workspace = await prisma.workspace.create({
          data: {
            name: workspaceName,
            ownerId: newUser.id,
          },
        });

        // Add user to workspace as ADMIN
        await prisma.userWorkspace.create({
          data: {
            userId: newUser.id,
            workspaceId: workspace.id,
            role: WorkspaceRole.ADMIN,
          },
        });

        // Log the registration
        await this.auditLogsService.create({
          userId: newUser.id,
          workspaceId: workspace.id,
          action: 'USER_REGISTRATION_OAUTH',
          details: {
            provider,
            email,
            plan: Plan.STARTER,
            workspace: workspaceName,
          },
        });

        // Generate tokens
        const payload = {
          email: newUser.email,
          sub: newUser.id,
          role: newUser.role,
          plan: newUser.plan,
        };

        const jwtAccessToken = this.tokensService.generateAccessToken(payload);
        const refreshToken = await this.tokensService.generateRefreshToken(
          newUser.id,
          req?.ip,
          req?.headers['user-agent'],
          req?.headers['x-device-fingerprint'] as string,
        );

        return {
          accessToken: jwtAccessToken,
          refreshToken,
          user: newUser,
          workspace,
          isNewUser: true,
        };
      });

      return result;
    } catch (error) {
      throw new BadRequestException(`OAuth registration failed: ${error.message}`);
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string, req?: Request) {
    const { user, sessionId } = await this.tokensService.validateRefreshToken(refreshToken);

    // Create payload for new access token
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      ownerId: user.ownerId,
      plan: user.plan,
    };

    // Generate new access token
    const accessToken = this.tokensService.generateAccessToken(payload);

    // Track token refresh in audit logs
    await this.auditLogsService.create({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      details: {
        sessionId,
        timestamp: new Date().toISOString(),
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgName: user.orgName,
        plan: user.plan,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string, userId: string) {
    const revoked = await this.tokensService.revokeRefreshToken(refreshToken);

    if (revoked) {
      // Log the logout action
      await this.auditLogsService.create({
        userId,
        action: 'USER_LOGOUT',
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return { success: revoked };
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   */
  async logoutFromAllDevices(userId: string) {
    const revoked = await this.tokensService.revokeAllUserRefreshTokens(userId);

    if (revoked) {
      // Log the action
      await this.auditLogsService.create({
        userId,
        action: 'USER_LOGOUT_ALL',
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return { success: revoked };
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string) {
    return this.tokensService.getUserSessions(userId);
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, req?: Request) {
    const { email, password, firstName, lastName, orgName } = registerDto;

    // Check if user with email already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(`User with email ${email} already exists`);
    }

    try {
      // Start a transaction to create user, assign default role, and create workspace
      return await this.prismaService.$transaction(async (prisma) => {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user with default MEMBER role and STARTER plan
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'MEMBER', // Default role
            orgName,
            plan: Plan.STARTER,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            orgName: true,
            plan: true,
            createdAt: true,
          },
        });

        // Find default Member role
        const defaultRole = await prisma.role.findUnique({
          where: { name: 'Member' },
        });

        if (defaultRole) {
          // Assign default role
          await prisma.userRoleAssignment.create({
            data: {
              userId: user.id,
              roleId: defaultRole.id,
            },
          });
        }

        // Create personal workspace for the user
        const workspaceName = orgName 
          ? `${orgName} Workspace` 
          : `${firstName || 'Personal'}'s Workspace`;
          
        const workspace = await prisma.workspace.create({
          data: {
            name: workspaceName,
            ownerId: user.id,
          },
        });

        // Add user to workspace as ADMIN
        await prisma.userWorkspace.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            role: WorkspaceRole.ADMIN,
          },
        });

        // Log the registration
        await this.auditLogsService.create({
          userId: user.id,
          workspaceId: workspace.id,
          action: 'USER_REGISTRATION',
          details: {
            email: user.email,
            plan: Plan.STARTER,
            workspace: workspaceName,
          },
        });

        // Generate tokens
        const payload = {
          email: user.email,
          sub: user.id,
          role: user.role,
          plan: user.plan,
        };
        const accessToken = this.tokensService.generateAccessToken(payload);
        const refreshToken = await this.tokensService.generateRefreshToken(
          user.id,
          req?.ip,
          req?.headers['user-agent'],
          req?.headers['x-device-fingerprint'] as string,
        );

        return {
          accessToken,
          refreshToken,
          user,
          workspace,
        };
      });
    } catch (error) {
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }
}
