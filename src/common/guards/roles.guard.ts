// src/common/guards/roles.guard.ts
import { PrismaService } from '@/prisma/prisma.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    // If no roles are specified, allow access
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new ForbiddenException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach user to request
      request.user = payload;

      // Check if user has the required role
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // Check workspace permissions if workspace_id is in the URL
      const workspaceId = request.params.workspace_id;
      if (workspaceId) {
        const userWorkspace = await this.prismaService.userWorkspace.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId,
            },
          },
        });

        // Check if user is the workspace owner
        const workspace = await this.prismaService.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (
          workspace?.ownerId === user.id || // User is the workspace owner
          (userWorkspace && roles.includes(userWorkspace.role)) || // User has the required workspace role
          roles.includes(user.role) // User has the required global role
        ) {
          return true;
        }

        return false;
      }

      // Check global roles
      return roles.includes(user.role);
    } catch (error) {
      throw new ForbiddenException('Invalid token');
    }
  }

  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
