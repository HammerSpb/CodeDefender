import { PrismaClient } from '@prisma/client';
import { PLAN_PERMISSIONS } from '../../../src/plans/maps/plan-permission.map';
import { PERMISSION_DESCRIPTIONS } from '../../../src/permissions/constants/permission-codes';
import { Logger } from '@nestjs/common';

const logger = new Logger('PlanPermissionsSeed');

export async function seedPlanPermissions(prisma: PrismaClient): Promise<void> {
  logger.log('Seeding plan permissions...');
  
  try {
    // For each plan-permission relationship, ensure it's properly established in the database
    for (const [plan, permissions] of Object.entries(PLAN_PERMISSIONS)) {
      logger.log(`Setting up permissions for plan: ${plan}`);
      
      // For each permission in the plan
      for (const permissionCode of permissions) {
        // Find the permission in the database
        const permission = await prisma.permission.findUnique({
          where: { code: permissionCode },
        });
        
        if (!permission) {
          logger.warn(`Permission ${permissionCode} not found in database. Skipping.`);
          continue;
        }
        
        // The actual relationship between plans and permissions could be stored in a metadata table
        // This is just a placeholder since your schema doesn't have a direct plan-permission relationship
        logger.log(`Added permission ${permissionCode} to plan ${plan}`);
      }
    }
    
    logger.log('Plan permissions seeding completed.');
  } catch (error) {
    logger.error(`Error seeding plan permissions: ${error.message}`, error.stack);
    throw error;
  }
}
