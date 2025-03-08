import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SchedulesService } from './schedules.service';

@Processor('schedules')
export class SchedulesProcessor {
  private readonly logger = new Logger(SchedulesProcessor.name);

  constructor(private schedulesService: SchedulesService) {}

  @Process('trigger-scan')
  async handleTriggerScan(job: Job) {
    try {
      const { scheduleId, userId } = job.data;
      this.logger.debug(`Triggering scan for schedule ${scheduleId}`);

      const scan = await this.schedulesService.triggerScan(scheduleId, userId);

      this.logger.debug(`Scan ${scan.id} created from schedule ${scheduleId}`);
      return scan;
    } catch (error) {
      this.logger.error(`Error triggering scan: ${error.message}`, error.stack);
      throw error;
    }
  }
}
