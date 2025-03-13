import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { TokensService } from '../tokens.service';
import { Request } from 'express';

@Injectable()
export class PasswordlessService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokensService: TokensService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a magic link token for passwordless authentication
   */
  async createMagicLink(email: string, ipAddress?: string): Promise<string> {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a random token
    const tokenValue = randomBytes(32).toString('hex');
    
    // Calculate expiration (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store the token in the database
    await this.prismaService.passwordlessToken.create({
      data: {
        userId: user.id,
        token: tokenValue,
        expiresAt,
        ipAddress,
        isUsed: false,
      },
    });

    // Log the magic link request
    await this.auditLogsService.create({
      userId: user.id,
      action: 'MAGIC_LINK_REQUEST',
      details: {
        email,
        ipAddress,
        timestamp: new Date().toISOString(),
      },
    });

    // Sign the token to include user information
    return this.jwtService.sign(
      { 
        sub: user.id,
        email: user.email,
        token: tokenValue,
      },
      {
        expiresIn: '15m', // Same as the database expiration
      }
    );
  }

  /**
   * Verify a magic link token and authenticate the user
   */
  async verifyMagicLink(token: string, req?: Request) {
    try {
      // Verify the token signature
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const tokenValue = payload.token;

      // Find the token in the database
      const magicLinkToken = await this.prismaService.passwordlessToken.findFirst({
        where: {
          userId,
          token: tokenValue,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      // Check if token exists and is valid
      if (!magicLinkToken) {
        throw new UnauthorizedException('Invalid or expired magic link');
      }

      // Mark the token as used
      await this.prismaService.passwordlessToken.update({
        where: { id: magicLinkToken.id },
        data: { isUsed: true },
      });

      // Log the successful authentication
      await this.auditLogsService.create({
        userId,
        action: 'MAGIC_LINK_LOGIN',
        details: {
          email: magicLinkToken.user.email,
          ipAddress: req?.ip,
          userAgent: req?.headers['user-agent'],
          timestamp: new Date().toISOString(),
        },
      });

      // Create JWT tokens
      const accessToken = this.tokensService.generateAccessToken({
        sub: userId,
        email: magicLinkToken.user.email,
        role: magicLinkToken.user.role,
        ownerId: magicLinkToken.user.ownerId,
        plan: magicLinkToken.user.plan,
      });

      const refreshToken = await this.tokensService.generateRefreshToken(
        userId,
        req?.ip,
        req?.headers['user-agent'],
        req?.headers['x-device-fingerprint'] as string,
      );

      // Return tokens and user info
      return {
        accessToken,
        refreshToken,
        user: {
          id: magicLinkToken.user.id,
          email: magicLinkToken.user.email,
          firstName: magicLinkToken.user.firstName,
          lastName: magicLinkToken.user.lastName,
          role: magicLinkToken.user.role,
          plan: magicLinkToken.user.plan,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }
  }

  /**
   * Method to simulate email sending - in production, replace with actual email service
   */
  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const magicLink = `${frontendUrl}/auth/verify?token=${token}`;
    
    // In production, replace this with actual email sending logic
    console.log(`
    =============== MAGIC LINK EMAIL ===============
    To: ${email}
    Subject: Your CodeDefender Login Link
    
    Hello,
    
    Click the link below to log in to CodeDefender:
    ${magicLink}
    
    This link will expire in 15 minutes and can only be used once.
    
    If you didn't request this login link, please ignore this email.
    
    ================================================
    `);
    
    // In a real application, you would use an email service like:
    // await this.emailService.sendMail({
    //   to: email,
    //   subject: 'Your CodeDefender Login Link',
    //   html: `<p>Click <a href="${magicLink}">here</a> to log in</p>`,
    // });
  }
}
