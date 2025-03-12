import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Scan, ScanStatus, UserRole } from '@prisma/client';
import { Queue } from 'bull';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScansService {
  constructor(
    private prismaService: PrismaService,
    private auditLogsService: AuditLogsService,
    @InjectQueue('scans') private scansQueue: Queue,
  ) {}

  async create(createScanDto: CreateScanDto, userId: string): Promise<Scan> {
    // Check if the user has access to the workspace
    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: createScanDto.workspaceId },
      include: {
        userWorkspaces: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (
      user?.role !== UserRole.SUPER &&
      workspace.ownerId !== userId &&
      (workspace.userWorkspaces.length === 0 || workspace.userWorkspaces[0].role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only workspace owners and admins can create scans');
    }

    // Create the scan
    const scan = await this.prismaService.scan.create({
      data: {
        repositoryId: createScanDto.repositoryId,
        workspaceId: createScanDto.workspaceId,
        branch: createScanDto.branch,
        status: ScanStatus.QUEUED,
        historical: createScanDto.historical || false,
        fileExclusions: createScanDto.fileExclusions || [],
      },
    });

    // Add job to the queue
    await this.scansQueue.add('scan', {
      scanId: scan.id,
      userId,
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      workspaceId: createScanDto.workspaceId,
      action: 'CREATE_SCAN',
      details: {
        scanId: scan.id,
        repositoryId: createScanDto.repositoryId,
        branch: createScanDto.branch,
      },
    });

    return scan;
  }

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Scan[]> {
    // Check if the user has access to the workspace
    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        userWorkspaces: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (user?.role !== UserRole.SUPER && workspace.ownerId !== userId && workspace.userWorkspaces.length === 0) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Get all scans for the workspace
    return this.prismaService.scan.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistoricalByWorkspace(workspaceId: string, userId: string): Promise<Scan[]> {
    // Check if the user has access to the workspace
    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        userWorkspaces: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (user?.role !== UserRole.SUPER && workspace.ownerId !== userId && workspace.userWorkspaces.length === 0) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Get historical scans for the workspace
    return this.prismaService.scan.findMany({
      where: { 
        workspaceId,
        historical: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Scan> {
    const scan = await this.prismaService.scan.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            userWorkspaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (
      user?.role !== UserRole.SUPER &&
      scan.workspace.ownerId !== userId &&
      scan.workspace.userWorkspaces.length === 0
    ) {
      throw new ForbiddenException('You do not have access to this scan');
    }

    return scan;
  }

  async remove(id: string, userId: string): Promise<Scan> {
    // Get the scan with workspace included
    const scanWithWorkspace = await this.prismaService.scan.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            userWorkspaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!scanWithWorkspace) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Now you can safely access workspace
    if (
      user?.role !== UserRole.SUPER &&
      scanWithWorkspace.workspace.ownerId !== userId &&
      (scanWithWorkspace.workspace.userWorkspaces.length === 0 ||
        scanWithWorkspace.workspace.userWorkspaces[0].role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only workspace owners and admins can delete scans');
    }

    // Delete the scan
    const deletedScan = await this.prismaService.scan.delete({
      where: { id },
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      workspaceId: scanWithWorkspace.workspaceId,
      action: 'DELETE_SCAN',
      details: {
        scanId: scanWithWorkspace.id,
      },
    });

    return deletedScan;
  }

  async updateScanStatus(id: string, status: ScanStatus, results?: any): Promise<Scan> {
    const scan = await this.prismaService.scan.findUnique({
      where: { id },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }

    const data: any = { status };

    if (status === ScanStatus.COMPLETED) {
      data.completedAt = new Date();
      data.results = results;
    }

    return this.prismaService.scan.update({
      where: { id },
      data,
    });
  }
}
