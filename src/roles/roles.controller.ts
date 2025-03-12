import { 
  Controller, Get, Post, Body, Param, Delete, UseGuards, 
  Request, HttpStatus, HttpCode, Put, ForbiddenException
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { RequiresPermission } from '@/permissions/decorators/requires-permission.decorator';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all available roles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all roles' })
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get roles for a specific user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns roles for the user' })
  @RequiresPermission('USER:VIEW_ROLES')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Post('user/:userId/assign')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Role assigned successfully' })
  @RequiresPermission('USER:MANAGE_ROLES')
  async assignRole(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: { roleId: string; workspaceId?: string }
  ) {
    return this.rolesService.assignRole(
      req.user.userId,
      userId,
      body.roleId,
      body.workspaceId
    );
  }

  @Delete('user/:userId/role/:roleId')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiParam({ name: 'roleId', description: 'ID of the role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role removed successfully' })
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('USER:MANAGE_ROLES')
  async removeRole(
    @Request() req,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Body() body: { workspaceId?: string }
  ) {
    return this.rolesService.removeRole(
      req.user.userId,
      userId,
      roleId,
      body.workspaceId
    );
  }

  @Put('user/:userId/role')
  @ApiOperation({ summary: 'Change a user\'s role' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role changed successfully' })
  @RequiresPermission('USER:MANAGE_ROLES')
  async changeRole(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: { newRoleId: string; workspaceId?: string }
  ) {
    return this.rolesService.changeRole(
      req.user.userId,
      userId,
      body.newRoleId,
      body.workspaceId
    );
  }
}

/**
 * Create specific controller for workspace role management
 */
@ApiTags('workspaces')
@Controller('workspaces/:workspaceId/roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WorkspaceRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles assigned in a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'ID of the workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user roles in workspace' })
  @RequiresPermission('WORKSPACE:VIEW_ROLES')
  async getWorkspaceRoles(@Param('workspaceId') workspaceId: string) {
    return this.rolesService.getWorkspaceUserRoles(workspaceId);
  }

  @Post('user/:userId/assign')
  @ApiOperation({ summary: 'Assign a workspace role to a user' })
  @ApiParam({ name: 'workspaceId', description: 'ID of the workspace' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Role assigned successfully' })
  @RequiresPermission('WORKSPACE:MANAGE_ROLES')
  async assignWorkspaceRole(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() body: { roleId: string }
  ) {
    return this.rolesService.assignRole(
      req.user.userId,
      userId,
      body.roleId,
      workspaceId
    );
  }

  @Delete('user/:userId/role/:roleId')
  @ApiOperation({ summary: 'Remove a workspace role from a user' })
  @ApiParam({ name: 'workspaceId', description: 'ID of the workspace' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiParam({ name: 'roleId', description: 'ID of the role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role removed successfully' })
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('WORKSPACE:MANAGE_ROLES')
  async removeWorkspaceRole(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ) {
    return this.rolesService.removeRole(
      req.user.userId,
      userId,
      roleId,
      workspaceId
    );
  }

  @Put('user/:userId/role')
  @ApiOperation({ summary: 'Change a user\'s workspace role' })
  @ApiParam({ name: 'workspaceId', description: 'ID of the workspace' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role changed successfully' })
  @RequiresPermission('WORKSPACE:MANAGE_ROLES')
  async changeWorkspaceRole(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() body: { newRoleId: string }
  ) {
    return this.rolesService.changeRole(
      req.user.userId,
      userId,
      body.newRoleId,
      workspaceId
    );
  }
}
