// src/scans/scans.controller.ts
import { Controller, Body, Get, Post, Delete, Param, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScansService } from './scans.service';
import {
  CanCreateScan,
  CanViewScan,
  CanDeleteScan,
  CanAccessHistoricalScans,
  CanCreateAdvancedScan,
} from './decorators/scan-policy.decorator';

@ApiTags('scans')
@Controller('workspaces/:workspace_id/scans')
@ApiBearerAuth()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @CanCreateScan()
  @ApiOperation({ summary: 'Create a new scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden or plan limits exceeded' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto, @Request() req) {
    // Set the workspace ID from the URL parameter
    createScanDto.workspaceId = workspaceId;
    return this.scansService.create(createScanDto, req.user.sub);
  }

  @Post('advanced')
  @CanCreateAdvancedScan()
  @ApiOperation({ summary: 'Create an advanced scan with custom rules and settings' })
  @ApiResponse({ status: 201, description: 'Advanced scan created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden or requires Pro plan or higher' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  createAdvanced(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto, @Request() req) {
    // Mark as advanced scan
    createScanDto.workspaceId = workspaceId;
    createScanDto.isAdvanced = true;
    return this.scansService.create(createScanDto, req.user.sub);
  }

  @Get()
  @CanViewScan()
  @ApiOperation({ summary: 'Get all scans for a workspace' })
  @ApiResponse({ status: 200, description: 'Return all scans for a workspace' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findAll(@Param('workspace_id') workspaceId: string, @Request() req) {
    return this.scansService.findAllByWorkspace(workspaceId, req.user.sub);
  }

  @Get('historical')
  @CanAccessHistoricalScans()
  @ApiOperation({ summary: 'Get historical scans for a workspace' })
  @ApiResponse({ status: 200, description: 'Return historical scans' })
  @ApiResponse({ status: 403, description: 'Forbidden or requires Pro plan or higher' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findHistorical(@Param('workspace_id') workspaceId: string, @Request() req) {
    return this.scansService.findHistoricalByWorkspace(workspaceId, req.user.sub);
  }

  @Get(':id')
  @CanViewScan()
  @ApiOperation({ summary: 'Get a scan by ID' })
  @ApiResponse({ status: 200, description: 'Return the scan' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.scansService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  @CanDeleteScan()
  @ApiOperation({ summary: 'Delete a scan' })
  @ApiResponse({ status: 200, description: 'Scan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.scansService.remove(id, req.user.sub);
  }
}
