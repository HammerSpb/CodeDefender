import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';
export const PERMISSION_OPTIONS_KEY = 'permission_options';

/**
 * Permission decorator options
 */
export interface PermissionOptions {
  requireAll?: boolean; // If true, all permissions must be satisfied (AND logic), otherwise any permission is sufficient (OR logic)
  errorMessage?: string; // Custom error message
  allowSuper?: boolean; // Whether to automatically allow SUPER users regardless of specific permissions (default: true)
  requireWorkspace?: boolean; // Whether a workspace context is required (default: false)
}

/**
 * Decorator to require one or more permissions to access a route or method
 * @param permissions Single permission string or array of permissions
 * @param options Permission check options
 */
export const RequiresPermission = (
  permissions: string | string[],
  options?: PermissionOptions,
) => {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const defaultOptions: PermissionOptions = {
    requireAll: false,
    allowSuper: true,
    requireWorkspace: false,
    ...options,
  };

  return (target: any, key?: string | symbol, descriptor?: any) => {
    // Class decorator
    if (typeof target === 'function' && !key) {
      SetMetadata(PERMISSION_KEY, permissionArray)(target);
      SetMetadata(PERMISSION_OPTIONS_KEY, defaultOptions)(target);
      return target;
    }
    
    // Method decorator
    if (descriptor) {
      SetMetadata(PERMISSION_KEY, permissionArray)(target, key as string | symbol, descriptor);
      SetMetadata(PERMISSION_OPTIONS_KEY, defaultOptions)(target, key as string | symbol, descriptor);
    }
    
    return descriptor;
  };
};

/**
 * Shorthand decorator requiring ALL permissions to be satisfied
 */
export const RequiresAllPermissions = (
  permissions: string[],
  options?: Omit<PermissionOptions, 'requireAll'>
) => {
  return RequiresPermission(permissions, { ...options, requireAll: true });
};

/**
 * Shorthand decorator requiring ANY permission to be satisfied
 */
export const RequiresAnyPermission = (
  permissions: string[],
  options?: Omit<PermissionOptions, 'requireAll'>
) => {
  return RequiresPermission(permissions, { ...options, requireAll: false });
};

/**
 * Decorator for routes requiring workspace-specific permissions
 */
export const RequiresWorkspacePermission = (
  permissions: string | string[],
  options?: Omit<PermissionOptions, 'requireWorkspace'>
) => {
  return RequiresPermission(permissions, { ...options, requireWorkspace: true });
};
