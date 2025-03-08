import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.SUPER)
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiResponse({ status: 200, description: 'Return all audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.auditLogsService.findAll();
  }

  @Get('workspaces/:workspaceId')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs for a workspace' })
  @ApiResponse({ status: 200, description: 'Return workspace audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.auditLogsService.findByWorkspace(workspaceId);
  }

  @Get('users/:userId')
  @Roles(UserRole.SUPER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get audit logs for a user' })
  @ApiResponse({ status: 200, description: 'Return user audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByUser(@Param('userId') userId: string, @Request() req) {
    // Allow owners to see logs for their own users
    if (req.user.role === UserRole.OWNER && req.user.sub !== userId) {
      // You'd need to check if the user belongs to the owner here
    }
    return this.auditLogsService.findByUser(userId);
  }

  @Get('my-logs')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get audit logs for the current user' })
  @ApiResponse({ status: 200, description: 'Return current user audit logs' })
  findMyLogs(@Request() req) {
    return this.auditLogsService.findByUser(req.user.sub);
  }
}
