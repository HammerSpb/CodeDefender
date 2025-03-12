import { Plan } from '@prisma/client';

export interface PlanLimits {
  scansPerDay: number;
  maxWorkspaces: number;
  maxUsersPerWorkspace: number;
  retentionDays: number;
}

export const PLAN_FEATURE_PERMISSIONS: Record<Plan, string[]> = {
  [Plan.STARTER]: [
    'SCAN:VIEW',
    'REPORT:VIEW',
    'WORKSPACE:VIEW',
    'SCAN:CREATE:BASIC',
    'SCAN:RUN',
    'REPOSITORY:VIEW',
    'SCHEDULE:VIEW',
  ],
  [Plan.PRO]: [
    'SCAN:VIEW',
    'REPORT:VIEW',
    'WORKSPACE:VIEW',
    'SCAN:CREATE:BASIC',
    'SCAN:RUN',
    'WORKSPACE:EDIT',
    'REPOSITORY:VIEW',
    'REPOSITORY:ADD',
    'SCHEDULE:VIEW',
    'SCHEDULE:CREATE',
    'REPORT:EXPORT',
  ],
  [Plan.BUSINESS]: [
    'SCAN:VIEW',
    'REPORT:VIEW',
    'WORKSPACE:VIEW',
    'SCAN:CREATE:BASIC',
    'SCAN:CREATE:ADVANCED',
    'SCAN:RUN',
    'WORKSPACE:EDIT',
    'WORKSPACE:MANAGE_USERS',
    'REPOSITORY:VIEW',
    'REPOSITORY:ADD',
    'SCHEDULE:VIEW',
    'SCHEDULE:CREATE',
    'SCHEDULE:EDIT',
    'REPORT:EXPORT',
    'REPORT:SHARE',
  ],
  [Plan.ENTERPRISE]: [
    'SCAN:VIEW',
    'REPORT:VIEW',
    'WORKSPACE:VIEW',
    'SCAN:CREATE:BASIC',
    'SCAN:CREATE:ADVANCED',
    'SCAN:RUN',
    'WORKSPACE:EDIT',
    'WORKSPACE:MANAGE_USERS',
    'REPOSITORY:VIEW',
    'REPOSITORY:ADD',
    'SCHEDULE:VIEW',
    'SCHEDULE:CREATE',
    'SCHEDULE:EDIT',
    'REPORT:EXPORT',
    'REPORT:SHARE',
    'API:USE',
    'BILLING:VIEW',
  ],
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.STARTER]: {
    scansPerDay: 3,
    maxWorkspaces: 1,
    maxUsersPerWorkspace: 3,
    retentionDays: 30,
  },
  [Plan.PRO]: {
    scansPerDay: 10,
    maxWorkspaces: 3,
    maxUsersPerWorkspace: 10,
    retentionDays: 90,
  },
  [Plan.BUSINESS]: {
    scansPerDay: 30,
    maxWorkspaces: 10,
    maxUsersPerWorkspace: 25,
    retentionDays: 180,
  },
  [Plan.ENTERPRISE]: {
    scansPerDay: -1, // Unlimited
    maxWorkspaces: -1, // Unlimited
    maxUsersPerWorkspace: -1, // Unlimited
    retentionDays: 365,
  },
};
