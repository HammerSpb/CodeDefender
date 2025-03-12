// Permission Scopes
export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  WORKSPACE = 'WORKSPACE',
  SCAN = 'SCAN',
  REPORT = 'REPORT',
  USER = 'USER',
  REPOSITORY = 'REPOSITORY',
  SCHEDULE = 'SCHEDULE',
}

// Permission Actions
export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXECUTE = 'EXECUTE',
  MANAGE = 'MANAGE', // Reserved for complete control over a resource
}

// Permission Resources
export enum PermissionResource {
  WORKSPACE = 'WORKSPACE',
  SCAN = 'SCAN',
  REPORT = 'REPORT',
  USER = 'USER',
  REPOSITORY = 'REPOSITORY',
  SCHEDULE = 'SCHEDULE',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  SETTINGS = 'SETTINGS',
}

// Generate permission code helper
export const createPermissionCode = (
  resource: PermissionResource,
  action: PermissionAction,
): string => {
  return `${resource}:${action}`;
};

// Define all permission codes
export const PERMISSION_CODES = {
  // Workspace permissions
  WORKSPACE_CREATE: createPermissionCode(PermissionResource.WORKSPACE, PermissionAction.CREATE),
  WORKSPACE_READ: createPermissionCode(PermissionResource.WORKSPACE, PermissionAction.READ),
  WORKSPACE_UPDATE: createPermissionCode(PermissionResource.WORKSPACE, PermissionAction.UPDATE),
  WORKSPACE_DELETE: createPermissionCode(PermissionResource.WORKSPACE, PermissionAction.DELETE),
  WORKSPACE_MANAGE: createPermissionCode(PermissionResource.WORKSPACE, PermissionAction.MANAGE),
  
  // Scan permissions
  SCAN_CREATE: createPermissionCode(PermissionResource.SCAN, PermissionAction.CREATE),
  SCAN_READ: createPermissionCode(PermissionResource.SCAN, PermissionAction.READ),
  SCAN_UPDATE: createPermissionCode(PermissionResource.SCAN, PermissionAction.UPDATE),
  SCAN_DELETE: createPermissionCode(PermissionResource.SCAN, PermissionAction.DELETE),
  SCAN_EXECUTE: createPermissionCode(PermissionResource.SCAN, PermissionAction.EXECUTE),
  
  // Report permissions
  REPORT_CREATE: createPermissionCode(PermissionResource.REPORT, PermissionAction.CREATE),
  REPORT_READ: createPermissionCode(PermissionResource.REPORT, PermissionAction.READ),
  REPORT_UPDATE: createPermissionCode(PermissionResource.REPORT, PermissionAction.UPDATE),
  REPORT_DELETE: createPermissionCode(PermissionResource.REPORT, PermissionAction.DELETE),
  
  // User permissions
  USER_CREATE: createPermissionCode(PermissionResource.USER, PermissionAction.CREATE),
  USER_READ: createPermissionCode(PermissionResource.USER, PermissionAction.READ),
  USER_UPDATE: createPermissionCode(PermissionResource.USER, PermissionAction.UPDATE),
  USER_DELETE: createPermissionCode(PermissionResource.USER, PermissionAction.DELETE),
  USER_MANAGE: createPermissionCode(PermissionResource.USER, PermissionAction.MANAGE),
  
  // Repository permissions
  REPOSITORY_CREATE: createPermissionCode(PermissionResource.REPOSITORY, PermissionAction.CREATE),
  REPOSITORY_READ: createPermissionCode(PermissionResource.REPOSITORY, PermissionAction.READ),
  REPOSITORY_UPDATE: createPermissionCode(PermissionResource.REPOSITORY, PermissionAction.UPDATE),
  REPOSITORY_DELETE: createPermissionCode(PermissionResource.REPOSITORY, PermissionAction.DELETE),
  
  // Schedule permissions
  SCHEDULE_CREATE: createPermissionCode(PermissionResource.SCHEDULE, PermissionAction.CREATE),
  SCHEDULE_READ: createPermissionCode(PermissionResource.SCHEDULE, PermissionAction.READ),
  SCHEDULE_UPDATE: createPermissionCode(PermissionResource.SCHEDULE, PermissionAction.UPDATE),
  SCHEDULE_DELETE: createPermissionCode(PermissionResource.SCHEDULE, PermissionAction.DELETE),
  
  // Role permissions
  ROLE_CREATE: createPermissionCode(PermissionResource.ROLE, PermissionAction.CREATE),
  ROLE_READ: createPermissionCode(PermissionResource.ROLE, PermissionAction.READ),
  ROLE_UPDATE: createPermissionCode(PermissionResource.ROLE, PermissionAction.UPDATE),
  ROLE_DELETE: createPermissionCode(PermissionResource.ROLE, PermissionAction.DELETE),
  
  // Permission management
  PERMISSION_READ: createPermissionCode(PermissionResource.PERMISSION, PermissionAction.READ),
  PERMISSION_MANAGE: createPermissionCode(PermissionResource.PERMISSION, PermissionAction.MANAGE),
  
  // Settings permissions
  SETTINGS_READ: createPermissionCode(PermissionResource.SETTINGS, PermissionAction.READ),
  SETTINGS_UPDATE: createPermissionCode(PermissionResource.SETTINGS, PermissionAction.UPDATE),
  SETTINGS_MANAGE: createPermissionCode(PermissionResource.SETTINGS, PermissionAction.MANAGE),
};

// Permission descriptions for documentation and UI
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSION_CODES.WORKSPACE_CREATE]: 'Create new workspaces',
  [PERMISSION_CODES.WORKSPACE_READ]: 'View workspace details',
  [PERMISSION_CODES.WORKSPACE_UPDATE]: 'Update workspace settings',
  [PERMISSION_CODES.WORKSPACE_DELETE]: 'Delete workspaces',
  [PERMISSION_CODES.WORKSPACE_MANAGE]: 'Full control over workspaces',
  
  [PERMISSION_CODES.SCAN_CREATE]: 'Create new security scans',
  [PERMISSION_CODES.SCAN_READ]: 'View scan details and results',
  [PERMISSION_CODES.SCAN_UPDATE]: 'Update scan settings',
  [PERMISSION_CODES.SCAN_DELETE]: 'Delete scans',
  [PERMISSION_CODES.SCAN_EXECUTE]: 'Execute scan operations',
  
  [PERMISSION_CODES.REPORT_CREATE]: 'Generate new reports',
  [PERMISSION_CODES.REPORT_READ]: 'View security reports',
  [PERMISSION_CODES.REPORT_UPDATE]: 'Update report settings',
  [PERMISSION_CODES.REPORT_DELETE]: 'Delete reports',
  
  [PERMISSION_CODES.USER_CREATE]: 'Invite users to workspaces',
  [PERMISSION_CODES.USER_READ]: 'View user information',
  [PERMISSION_CODES.USER_UPDATE]: 'Edit user settings',
  [PERMISSION_CODES.USER_DELETE]: 'Remove users',
  [PERMISSION_CODES.USER_MANAGE]: 'Full control over users',
  
  [PERMISSION_CODES.REPOSITORY_CREATE]: 'Connect new repositories',
  [PERMISSION_CODES.REPOSITORY_READ]: 'View repository information',
  [PERMISSION_CODES.REPOSITORY_UPDATE]: 'Update repository settings',
  [PERMISSION_CODES.REPOSITORY_DELETE]: 'Remove repositories',
  
  [PERMISSION_CODES.SCHEDULE_CREATE]: 'Create scan schedules',
  [PERMISSION_CODES.SCHEDULE_READ]: 'View scan schedules',
  [PERMISSION_CODES.SCHEDULE_UPDATE]: 'Update scan schedules',
  [PERMISSION_CODES.SCHEDULE_DELETE]: 'Remove scan schedules',
  
  [PERMISSION_CODES.ROLE_CREATE]: 'Create new roles',
  [PERMISSION_CODES.ROLE_READ]: 'View roles and their permissions',
  [PERMISSION_CODES.ROLE_UPDATE]: 'Update role permissions',
  [PERMISSION_CODES.ROLE_DELETE]: 'Delete roles',
  
  [PERMISSION_CODES.PERMISSION_READ]: 'View permissions',
  [PERMISSION_CODES.PERMISSION_MANAGE]: 'Manage permission assignments',
  
  [PERMISSION_CODES.SETTINGS_READ]: 'View system settings',
  [PERMISSION_CODES.SETTINGS_UPDATE]: 'Update system settings',
  [PERMISSION_CODES.SETTINGS_MANAGE]: 'Full control over system settings',
};
