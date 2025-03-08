// src/workspaces/workspaces.controller.ts
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AddUserToWorkspaceDto } from './dto/add-user-to-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.create(createWorkspaceDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.SUPER, UserRole.SUPPORT, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all workspaces accessible to the user' })
  @ApiResponse({ status: 200, description: 'Return all workspaces' })
  findAll(@Request() req) {
    return this.workspacesService.findAll(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.SUPER, UserRole.SUPPORT, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiResponse({ status: 200, description: 'Return the workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.workspacesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto, @Request() req) {
    return this.workspacesService.update(id, updateWorkspaceDto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.workspacesService.remove(id, req.user.sub);
  }

  @Post(':id/users')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a user to a workspace' })
  @ApiResponse({
    status: 201,
    description: 'User added to workspace successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Workspace or user not found' })
  addUser(@Param('id') id: string, @Body() addUserDto: AddUserToWorkspaceDto, @Request() req) {
    return this.workspacesService.addUser(id, addUserDto, req.user.sub);
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a user from a workspace' })
  @ApiResponse({
    status: 200,
    description: 'User removed from workspace successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found in workspace' })
  removeUser(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.workspacesService.removeUser(id, userId, req.user.sub);
  }
}
