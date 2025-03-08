import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ScanStatus } from '@prisma/client';
import { Job } from 'bull';
import { ScansService } from './scans.service';

@Processor('scans')
export class ScansProcessor {
  private readonly logger = new Logger(ScansProcessor.name);

  constructor(
    private scansService: ScansService,
    private prismaService: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  @Process('scan')
  async handleScan(job: Job) {
    try {
      const { scanId, userId } = job.data;
      this.logger.debug(`Processing scan ${scanId}`);

      // Update status to running
      await this.scansService.updateScanStatus(scanId, ScanStatus.RUNNING);

      // Get scan details
      const scan = await this.prismaService.scan.findUnique({
        where: { id: scanId },
        include: {
          repository: true,
        },
      });

      if (!scan) {
        throw new Error(`Scan ${scanId} not found`);
      }

      // Simulate the scanning process (in a real application, you would use actual code analysis tools)
      this.logger.debug('Scanning...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate 5 seconds of work

      // Generate mock scan results
      const results = this.generateMockResults();

      // Update scan status to completed with results
      const completedScan = await this.scansService.updateScanStatus(scanId, ScanStatus.COMPLETED, results);

      // Create audit log
      await this.auditLogsService.create({
        userId,
        workspaceId: scan.workspaceId,
        action: 'SCAN_COMPLETED',
        details: {
          scanId,
          findings: results.findings,
        },
      });

      this.logger.debug(`Scan ${scanId} completed`);
      return completedScan;
    } catch (error) {
      this.logger.error(`Error processing scan: ${error.message}`, error.stack);
      // Update scan status to failed
      if (job.data.scanId) {
        await this.scansService.updateScanStatus(job.data.scanId, ScanStatus.FAILED);
      }
      throw error;
    }
  }

  private generateMockResults() {
    // Generate mock scan results
    const highIssues = Math.floor(Math.random() * 5);
    const mediumIssues = Math.floor(Math.random() * 10);
    const lowIssues = Math.floor(Math.random() * 15);

    return {
      findings: {
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
      },
      scannedFiles: Math.floor(Math.random() * 200) + 50,
      secretsFound: Math.floor(Math.random() * 3),
      vulnerabilitiesFound: highIssues + Math.floor(mediumIssues / 2),
      details: {
        issues: this.generateMockIssues(highIssues, mediumIssues, lowIssues),
      },
    };
  }

  private generateMockIssues(high: number, medium: number, low: number) {
    interface Issue {
      id: string;
      type: string;
      description: string;
      severity: string;
      path: string;
      line: number;
    }

    const issues: Issue[] = [];

    const issueTypes = [
      { type: 'API Key', description: 'Exposed API key' },
      { type: 'Password', description: 'Hardcoded password' },
      { type: 'SQL Injection', description: 'Potential SQL injection vulnerability' },
      { type: 'XSS', description: 'Cross-site scripting vulnerability' },
      { type: 'Access Control', description: 'Weak access control' },
      { type: 'Insecure Configuration', description: 'Insecure configuration setting' },
    ];

    // Generate high severity issues
    for (let i = 0; i < high; i++) {
      const issueType = issueTypes[Math.floor(Math.random() * 2)]; // Use only the first 2 types for high
      issues.push({
        id: `HIGH-${i + 1}`,
        type: issueType.type,
        description: issueType.description,
        severity: 'high',
        path: `src/${['auth', 'config', 'api', 'services'][Math.floor(Math.random() * 4)]}/file${i + 1}.js`,
        line: Math.floor(Math.random() * 100) + 1,
      });
    }

    // Generate medium severity issues
    for (let i = 0; i < medium; i++) {
      const issueType = issueTypes[Math.floor(Math.random() * 4) + 1]; // Use types 1-4
      issues.push({
        id: `MED-${i + 1}`,
        type: issueType.type,
        description: issueType.description,
        severity: 'medium',
        path: `src/${['api', 'controllers', 'models', 'utils'][Math.floor(Math.random() * 4)]}/file${i + 1}.js`,
        line: Math.floor(Math.random() * 100) + 1,
      });
    }

    // Generate low severity issues
    for (let i = 0; i < low; i++) {
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      issues.push({
        id: `LOW-${i + 1}`,
        type: issueType.type,
        description: issueType.description,
        severity: 'low',
        path: `src/${['components', 'helpers', 'tests', 'styles'][Math.floor(Math.random() * 4)]}/file${i + 1}.js`,
        line: Math.floor(Math.random() * 100) + 1,
      });
    }

    return issues;
  }
}
