// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Proper way to handle application shutdown with Prisma
    process.on('beforeExit', async () => {
      await app.close();
    });

    // Add proper shutdown hooks
    process.on('SIGINT', async () => {
      await this.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.$disconnect();
      process.exit(0);
    });
  }
}
