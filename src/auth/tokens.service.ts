import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokensService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate an access token for a user
   */
  generateAccessToken(payload: JwtPayload) {
    const accessTokenExpiration = this.configService.get('JWT_EXPIRATION', '15m');

    return this.jwtService.sign(
      {
        ...payload,
        jti: randomUUID(), // Add unique identifier for token
      },
      {
        expiresIn: accessTokenExpiration,
      },
    );
  }

  /**
   * Generate a refresh token and store it in the database
   */
  async generateRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceFingerprint?: string,
  ) {
    // Define longer expiration for refresh token (e.g., 7 days)
    const refreshTokenExpiration = this.configService.get('REFRESH_TOKEN_EXPIRATION', '7d');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days if parsing fails
    
    if (refreshTokenExpiration.endsWith('d')) {
      const days = parseInt(refreshTokenExpiration.slice(0, -1));
      if (!isNaN(days)) {
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    } else if (refreshTokenExpiration.endsWith('h')) {
      const hours = parseInt(refreshTokenExpiration.slice(0, -1));
      if (!isNaN(hours)) {
        expiresAt.setHours(expiresAt.getHours() + hours);
      }
    }

    // Generate a unique token (JWT ID)
    const tokenId = randomUUID();

    // Store refresh token in database
    await this.prismaService.session.create({
      data: {
        userId,
        token: tokenId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        expiresAt,
      },
    });

    // Generate refresh token JWT
    return this.jwtService.sign(
      {
        sub: userId,
        jti: tokenId, // Use the same ID as stored in database
      },
      {
        expiresIn: refreshTokenExpiration,
      },
    );
  }

  /**
   * Validate a refresh token and return the user if valid
   */
  async validateRefreshToken(token: string) {
    try {
      // Verify token signature
      const payload = this.jwtService.verify(token);
      
      // Find token in database
      const session = await this.prismaService.session.findUnique({
        where: {
          token: payload.jti,
        },
        include: {
          user: true,
        },
      });

      // Check if token exists and is not revoked
      if (!session || session.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > session.expiresAt) {
        // Mark token as revoked if expired
        await this.prismaService.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Update last active timestamp
      await this.prismaService.session.update({
        where: { id: session.id },
        data: { lastActive: new Date() },
      });

      return {
        user: session.user,
        sessionId: session.id,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string) {
    try {
      // Verify token signature
      const payload = this.jwtService.verify(token);
      
      // Find and revoke token
      await this.prismaService.session.updateMany({
        where: {
          token: payload.jti,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserRefreshTokens(userId: string) {
    await this.prismaService.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return true;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string) {
    return this.prismaService.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        lastActive: true,
        createdAt: true,
      },
    });
  }
}
