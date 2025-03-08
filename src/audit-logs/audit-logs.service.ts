import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { AuditLog } from '@prisma/client';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prismaService: PrismaService) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    return this.prismaService.auditLog.create({
      data: {
        userId: createAuditLogDto.userId,
        workspaceId: createAuditLogDto.workspaceId,
        action: createAuditLogDto.action,
        details: createAuditLogDto.details,
      },
    });
  }

  async findAll(): Promise<AuditLog[]> {
    return this.prismaService.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<AuditLog[]> {
    return this.prismaService.auditLog.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.prismaService.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
