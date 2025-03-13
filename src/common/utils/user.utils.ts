import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('UserUtils');

/**
 * Get a user's role directly from the database
 * @param prisma PrismaService instance
 * @param userId User ID to check
 * @returns The user's role or null if not found
 */
export async function getUserRole(
  prisma: PrismaService, 
  userId: string
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || null;
  } catch (error) {
    logger.error(`Error fetching user role: ${error.message}`, error.stack);
    return null;
  }
}

/**
 * Check if a user is a super user
 * @param prisma PrismaService instance
 * @param userId User ID to check
 * @returns Boolean indicating if user is a super user
 */
export async function isUserSuper(
  prisma: PrismaService,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(prisma, userId);
  return role === 'SUPER';
}

/**
 * Check if a user belongs to a workspace
 * @param prisma PrismaService instance
 * @param userId User ID to check
 * @param workspaceId Workspace ID to check
 * @returns Boolean indicating if user belongs to the workspace
 */
export async function isUserInWorkspace(
  prisma: PrismaService,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    return !!userWorkspace;
  } catch (error) {
    logger.error(`Error checking workspace membership: ${error.message}`, error.stack);
    return false;
  }
}

/**
 * Get a user's workspace role
 * @param prisma PrismaService instance
 * @param userId User ID to check
 * @param workspaceId Workspace ID to check
 * @returns The user's workspace role or null if not found
 */
export async function getUserWorkspaceRole(
  prisma: PrismaService,
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: { role: true },
    });
    return userWorkspace?.role || null;
  } catch (error) {
    logger.error(`Error fetching workspace role: ${error.message}`, error.stack);
    return null;
  }
}
