import { ForbiddenException, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { extractResourceId, extractUserId } from './request.utils';
import { getUserRole, isUserSuper } from './user.utils';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Common options for authorization checks
 */
export interface AuthorizationOptions {
  allowSuper?: boolean;
  requireAll?: boolean;
  errorMessage?: string;
  requireWorkspace?: boolean;
  workspaceIdParam?: string;
}

/**
 * Extract common context information for guards
 * @param context Execution context
 * @param prisma PrismaService instance
 * @param options Authorization options
 * @returns Object with extracted context information
 */
export async function extractGuardContext(
  context: ExecutionContext,
  prisma: PrismaService,
  options: AuthorizationOptions = {}
) {
  const request = context.switchToHttp().getRequest();
  const userId = extractUserId(request);

  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }

  // Extract workspaceId if needed
  const workspaceId = options.workspaceIdParam 
    ? extractResourceId(request, options.workspaceIdParam)
    : undefined;

  // Check if workspace is required but not provided
  if (options.requireWorkspace && !workspaceId) {
    throw new ForbiddenException('Workspace ID is required for this operation');
  }

  // Check if user is SUPER and if we should short-circuit for super users
  let isSuper = false;
  if (options.allowSuper) {
    isSuper = await isUserSuper(prisma, userId);
  }

  return {
    request,
    userId,
    workspaceId,
    isSuper,
    userRole: await getUserRole(prisma, userId),
  };
}

/**
 * Handle common guard error conditions
 * @param condition Boolean condition to check
 * @param defaultMessage Default error message
 * @param options Authorization options
 * @throws ForbiddenException if condition is false
 */
export function handleGuardResult(
  condition: boolean,
  defaultMessage: string,
  options: AuthorizationOptions = {}
): void {
  if (!condition) {
    throw new ForbiddenException(
      options.errorMessage || defaultMessage
    );
  }
}

/**
 * Get required permissions from metadata
 * @param reflector Reflector instance
 * @param context Execution context
 * @param key Metadata key to extract
 * @returns Array of permissions or empty array if not found
 */
export function getRequiredPermissions(
  reflector: Reflector,
  context: ExecutionContext,
  key: string
): string[] {
  const permissions = reflector.getAllAndOverride<string[]>(
    key,
    [context.getHandler(), context.getClass()],
  );

  return permissions || [];
}

/**
 * Get options from metadata
 * @param reflector Reflector instance
 * @param context Execution context
 * @param key Metadata key to extract
 * @param defaultOptions Default options
 * @returns Options object
 */
export function getOptions<T>(
  reflector: Reflector,
  context: ExecutionContext,
  key: string,
  defaultOptions: T
): T {
  const options = reflector.getAllAndOverride<T>(
    key,
    [context.getHandler(), context.getClass()],
  );

  return { ...defaultOptions, ...options };
}
