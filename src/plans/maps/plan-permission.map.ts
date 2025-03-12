import { Plan } from '@prisma/client';
import { PERMISSION_CODES } from '../../permissions/constants/permission-codes';

// Define the starter permissions first
const STARTER_PERMISSIONS = [
  // Basic scan permissions
  PERMISSION_CODES.SCAN_READ,
  PERMISSION_CODES.SCAN_CREATE,
  PERMISSION_CODES.SCAN_EXECUTE,
  
  // Basic report permissions
  PERMISSION_CODES.REPORT_READ,
  
  // Workspace access
  PERMISSION_CODES.WORKSPACE_READ,
  
  // Repository access
  PERMISSION_CODES.REPOSITORY_READ,
  
  // Schedule access
  PERMISSION_CODES.SCHEDULE_READ,
  
  // User management (limited)
  PERMISSION_CODES.USER_READ,
];

// Define PRO permissions that are added on top of STARTER
const PRO_ADDITIONAL_PERMISSIONS = [
  // Enhanced scan and report permissions
  PERMISSION_CODES.SCAN_UPDATE,
  PERMISSION_CODES.REPORT_CREATE,
  PERMISSION_CODES.REPORT_UPDATE,
  
  // Workspace management
  PERMISSION_CODES.WORKSPACE_UPDATE,
  
  // Repository management
  PERMISSION_CODES.REPOSITORY_CREATE,
  PERMISSION_CODES.REPOSITORY_UPDATE,
  
  // Schedule management
  PERMISSION_CODES.SCHEDULE_CREATE,
  PERMISSION_CODES.SCHEDULE_UPDATE,
  
  // User management
  PERMISSION_CODES.USER_CREATE,
  PERMISSION_CODES.USER_UPDATE,
  
  // Settings access
  PERMISSION_CODES.SETTINGS_READ,
];

// Define BUSINESS permissions that are added on top of PRO
const BUSINESS_ADDITIONAL_PERMISSIONS = [
  // Complete scan and report permissions
  PERMISSION_CODES.SCAN_DELETE,
  PERMISSION_CODES.REPORT_DELETE,
  
  // Enhanced workspace management
  PERMISSION_CODES.WORKSPACE_MANAGE,
  
  // Complete repository management
  PERMISSION_CODES.REPOSITORY_DELETE,
  
  // Complete schedule management
  PERMISSION_CODES.SCHEDULE_DELETE,
  
  // Enhanced user management
  PERMISSION_CODES.USER_DELETE,
  
  // Role management
  PERMISSION_CODES.ROLE_CREATE,
  PERMISSION_CODES.ROLE_READ,
  PERMISSION_CODES.ROLE_UPDATE,
  
  // Permission visibility
  PERMISSION_CODES.PERMISSION_READ,
  
  // Settings management
  PERMISSION_CODES.SETTINGS_UPDATE,
];

// Define ENTERPRISE permissions that are added on top of BUSINESS
const ENTERPRISE_ADDITIONAL_PERMISSIONS = [
  // Complete workspace control
  PERMISSION_CODES.WORKSPACE_DELETE,
  
  // Complete user control
  PERMISSION_CODES.USER_MANAGE,
  
  // Complete role management
  PERMISSION_CODES.ROLE_DELETE,
  
  // Complete permission management
  PERMISSION_CODES.PERMISSION_MANAGE,
  
  // Complete settings control
  PERMISSION_CODES.SETTINGS_MANAGE,
];

// Create the PRO permissions by combining STARTER + PRO_ADDITIONAL
const PRO_PERMISSIONS = [
  ...STARTER_PERMISSIONS,
  ...PRO_ADDITIONAL_PERMISSIONS,
];

// Create the BUSINESS permissions by combining PRO + BUSINESS_ADDITIONAL
const BUSINESS_PERMISSIONS = [
  ...PRO_PERMISSIONS,
  ...BUSINESS_ADDITIONAL_PERMISSIONS,
];

// Create the ENTERPRISE permissions by combining BUSINESS + ENTERPRISE_ADDITIONAL
const ENTERPRISE_PERMISSIONS = [
  ...BUSINESS_PERMISSIONS,
  ...ENTERPRISE_ADDITIONAL_PERMISSIONS,
];

/**
 * Maps each plan to the permissions it has access to.
 * This centralized mapping allows us to determine which permissions
 * are available for each subscription plan.
 */
export const PLAN_PERMISSIONS: Record<Plan, string[]> = {
  [Plan.STARTER]: STARTER_PERMISSIONS,
  [Plan.PRO]: PRO_PERMISSIONS,
  [Plan.BUSINESS]: BUSINESS_PERMISSIONS,
  [Plan.ENTERPRISE]: ENTERPRISE_PERMISSIONS,
};

/**
 * Check if a plan includes a specific permission
 * @param plan The plan to check
 * @param permissionCode The permission code to check for
 */
export const planHasPermission = (plan: Plan, permissionCode: string): boolean => {
  return PLAN_PERMISSIONS[plan].includes(permissionCode);
};

/**
 * Get the minimum plan that includes a specific permission
 * @param permissionCode The permission code to check for
 */
export const getMinimumPlanForPermission = (permissionCode: string): Plan | null => {
  const plans = [Plan.STARTER, Plan.PRO, Plan.BUSINESS, Plan.ENTERPRISE];
  
  for (const plan of plans) {
    if (PLAN_PERMISSIONS[plan].includes(permissionCode)) {
      return plan;
    }
  }
  
  return null;
};

/**
 * Get upgrade messages for permissions not available in current plan
 * @param permissionCode The permission code to check
 * @param currentPlan The current plan
 */
export const getPermissionUpgradeMessage = (permissionCode: string, currentPlan: Plan): string | null => {
  const minimumPlan = getMinimumPlanForPermission(permissionCode);
  
  if (!minimumPlan) {
    return null;
  }
  
  const planIndex = Object.values(Plan).indexOf(currentPlan);
  const requiredPlanIndex = Object.values(Plan).indexOf(minimumPlan);
  
  if (requiredPlanIndex <= planIndex) {
    return null; // Current plan already includes this permission
  }
  
  return `This feature requires the ${minimumPlan} plan or higher. Please upgrade to access it.`;
};
