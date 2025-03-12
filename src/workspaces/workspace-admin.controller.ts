import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PERMISSION_CODES } from '../permissions/constants/permission-codes';
import { Feature, LimitType } from '../plans/constants/plan-features';
import { Authorize, AuthorizeWorkspace, AuthorizeResource } from '../permissions/decorators/unified-auth.decorator';
import { RequiresPermission } from '../permissions/decorators/requires-permission.decorator';
import { RequiresFeature } from '../plans/decorators/requires-feature.decorator';

@Controller('admin/workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceAdminController {
  
  // Example using basic permission guard
  @Get()
  @RequiresPermission(PERMISSION_CODES.WORKSPACE_READ)
  async getAllWorkspaces() {
    return { message: 'List of all workspaces' };
  }
  
  // Example using feature guard
  @Get('settings')
  @RequiresFeature(Feature.TEAM_MANAGEMENT)
  async getSettings() {
    return { message: 'Workspace settings' };
  }
  
  // Example using the unified authorization decorator
  @Post()
  @Authorize({
    permissions: [PERMISSION_CODES.WORKSPACE_CREATE],
    features: [Feature.TEAM_MANAGEMENT],
    limitType: LimitType.MAX_WORKSPACES,
    errorMessage: 'You do not have permission to create a workspace',
  })
  async createWorkspace(@Body() createWorkspaceDto: any) {
    return { message: 'Workspace created', id: 'new-id' };
  }
  
  // Example using workspace authorization
  @Get(':workspaceId')
  @AuthorizeWorkspace(
    [PERMISSION_CODES.WORKSPACE_READ],
    undefined,
    { errorMessage: 'You do not have access to view this workspace' }
  )
  async getWorkspace(@Param('workspaceId') workspaceId: string) {
    return { message: 'Workspace details', id: workspaceId };
  }
  
  // Example using resource authorization
  @Put(':workspaceId')
  @AuthorizeResource(
    'WORKSPACE',
    'workspaceId',
    [PERMISSION_CODES.WORKSPACE_UPDATE],
    [Feature.TEAM_MANAGEMENT],
    { requireAllPermissions: true }
  )
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: any
  ) {
    return { message: 'Workspace updated', id: workspaceId };
  }
  
  // Example with IP restriction
  @Delete(':workspaceId')
  @Authorize({
    permissions: [PERMISSION_CODES.WORKSPACE_DELETE],
    checkResourceOwnership: true,
    resourceType: 'WORKSPACE',
    resourceIdParam: 'workspaceId',
    ipRestrictions: {
      allowedIps: ['127.0.0.1', '::1'], // Only allow from localhost
    },
    failClosed: true, // Deny if any check fails
  })
  async deleteWorkspace(@Param('workspaceId') workspaceId: string) {
    return { message: 'Workspace deleted', id: workspaceId };
  }
  
  // Example with time restriction
  @Post(':workspaceId/users')
  @Authorize({
    permissions: [PERMISSION_CODES.USER_CREATE],
    checkWorkspaceMembership: true,
    timeRestriction: {
      startHour: 9,
      endHour: 17,
      timezone: 'UTC',
    },
    errorMessage: 'User invitations can only be sent during business hours (9-17 UTC)',
  })
  async inviteUser(
    @Param('workspaceId') workspaceId: string,
    @Body() inviteUserDto: any
  ) {
    return { message: 'User invited', workspaceId };
  }
  
  // Example with multiple permissions (any)
  @Get(':workspaceId/reports')
  @Authorize({
    permissions: [PERMISSION_CODES.REPORT_READ, PERMISSION_CODES.WORKSPACE_MANAGE],
    requireAllPermissions: false, // Any permission is sufficient
    checkWorkspaceMembership: true,
  })
  async getWorkspaceReports(@Param('workspaceId') workspaceId: string) {
    return { message: 'Workspace reports', workspaceId };
  }
  
  // Example with multiple permissions (all required)
  @Post(':workspaceId/advanced-config')
  @Authorize({
    permissions: [PERMISSION_CODES.WORKSPACE_UPDATE, PERMISSION_CODES.SETTINGS_UPDATE],
    requireAllPermissions: true, // All permissions required
    features: [Feature.ROLE_CUSTOMIZATION],
    checkResourceOwnership: true,
    resourceType: 'WORKSPACE',
    resourceIdParam: 'workspaceId',
  })
  async updateAdvancedConfig(
    @Param('workspaceId') workspaceId: string,
    @Body() configDto: any
  ) {
    return { message: 'Advanced configuration updated', workspaceId };
  }
}
