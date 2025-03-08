// src/scans/scans.controller.ts
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScansService } from './scans.service';

@ApiTags('scans')
@Controller('workspaces/:workspace_id/scans')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto, @Request() req) {
    // Set the workspace ID from the URL parameter
    createScanDto.workspaceId = workspaceId;
    return this.scansService.create(createScanDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all scans for a workspace' })
  @ApiResponse({ status: 200, description: 'Return all scans for a workspace' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findAll(@Param('workspace_id') workspaceId: string, @Request() req) {
    return this.scansService.findAllByWorkspace(workspaceId, req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get a scan by ID' })
  @ApiResponse({ status: 200, description: 'Return the scan' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.scansService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a scan' })
  @ApiResponse({ status: 200, description: 'Scan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.scansService.remove(id, req.user.sub);
  }
}
