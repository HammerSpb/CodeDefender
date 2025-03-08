// src/repositories/repositories.controller.ts
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('repositories')
@Controller('repositories')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post()
  @Roles(UserRole.SUPER, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new repository' })
  @ApiResponse({ status: 201, description: 'Repository created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createRepositoryDto: CreateRepositoryDto, @Request() req) {
    return this.repositoriesService.create(createRepositoryDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all accessible repositories' })
  @ApiResponse({ status: 200, description: 'Return all accessible repositories' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req) {
    return this.repositoriesService.findAll(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get a repository by ID' })
  @ApiResponse({ status: 200, description: 'Return the repository' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.repositoriesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER)
  @ApiOperation({ summary: 'Update a repository' })
  @ApiResponse({ status: 200, description: 'Repository updated successfully' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() updateRepositoryDto: UpdateRepositoryDto, @Request() req) {
    return this.repositoriesService.update(id, updateRepositoryDto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a repository' })
  @ApiResponse({ status: 200, description: 'Repository deleted successfully' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.repositoriesService.remove(id, req.user.sub);
  }
}
