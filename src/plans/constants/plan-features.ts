import { Plan } from '@prisma/client';

/**
 * Feature limits by plan
 */
export interface FeatureLimits {
  scansPerDay: number;
  scansPerMonth: number;
  usersPerWorkspace: number;
  maxWorkspaces: number;
  maxRepositories: number;
  maxHistoryDays: number;
  maxAlerts: number;
}

/**
 * Available features by plan
 */
export interface PlanFeatures {
  hasAdvancedScan: boolean;
  hasHistoricalScan: boolean;
  hasCustomRules: boolean;
  hasScheduledScans: boolean;
  hasApiAccess: boolean;
  hasReporting: boolean;
  hasExportReports: boolean;
  hasTeamManagement: boolean;
  hasSsoLogin: boolean;
  hasRoleCustomization: boolean;
  hasAuditLog: boolean;
  hasPrioritySuppport: boolean;
}

/**
 * Complete plan definition including limits and features
 */
export interface PlanDefinition extends PlanFeatures {
  name: string;
  limits: FeatureLimits;
}

/**
 * Define usage limits by plan
 */
export const PLAN_LIMITS: Record<Plan, FeatureLimits> = {
  [Plan.STARTER]: {
    scansPerDay: 5,
    scansPerMonth: 30,
    usersPerWorkspace: 3,
    maxWorkspaces: 1,
    maxRepositories: 5,
    maxHistoryDays: 14,
    maxAlerts: 100,
  },
  [Plan.PRO]: {
    scansPerDay: 20,
    scansPerMonth: 200,
    usersPerWorkspace: 10,
    maxWorkspaces: 3,
    maxRepositories: 20,
    maxHistoryDays: 30,
    maxAlerts: 500,
  },
  [Plan.BUSINESS]: {
    scansPerDay: 50,
    scansPerMonth: 500,
    usersPerWorkspace: 30,
    maxWorkspaces: 10,
    maxRepositories: 50,
    maxHistoryDays: 90,
    maxAlerts: 1000,
  },
  [Plan.ENTERPRISE]: {
    scansPerDay: 100,
    scansPerMonth: 1000,
    usersPerWorkspace: 100,
    maxWorkspaces: 100,
    maxRepositories: 500,
    maxHistoryDays: 365,
    maxAlerts: 5000,
  },
};

/**
 * Define features available by plan
 */
export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  [Plan.STARTER]: {
    hasAdvancedScan: false,
    hasHistoricalScan: false,
    hasCustomRules: false,
    hasScheduledScans: false,
    hasApiAccess: false,
    hasReporting: true,
    hasExportReports: false,
    hasTeamManagement: false,
    hasSsoLogin: false,
    hasRoleCustomization: false,
    hasAuditLog: false,
    hasPrioritySuppport: false,
  },
  [Plan.PRO]: {
    hasAdvancedScan: true,
    hasHistoricalScan: true,
    hasCustomRules: false,
    hasScheduledScans: true,
    hasApiAccess: true,
    hasReporting: true,
    hasExportReports: true,
    hasTeamManagement: true,
    hasSsoLogin: false,
    hasRoleCustomization: false,
    hasAuditLog: false,
    hasPrioritySuppport: false,
  },
  [Plan.BUSINESS]: {
    hasAdvancedScan: true,
    hasHistoricalScan: true,
    hasCustomRules: true,
    hasScheduledScans: true,
    hasApiAccess: true,
    hasReporting: true,
    hasExportReports: true,
    hasTeamManagement: true,
    hasSsoLogin: true,
    hasRoleCustomization: true,
    hasAuditLog: true,
    hasPrioritySuppport: false,
  },
  [Plan.ENTERPRISE]: {
    hasAdvancedScan: true,
    hasHistoricalScan: true,
    hasCustomRules: true,
    hasScheduledScans: true,
    hasApiAccess: true,
    hasReporting: true,
    hasExportReports: true,
    hasTeamManagement: true,
    hasSsoLogin: true,
    hasRoleCustomization: true,
    hasAuditLog: true,
    hasPrioritySuppport: true,
  },
};

/**
 * Complete plan definitions
 */
export const PLANS: Record<Plan, PlanDefinition> = {
  [Plan.STARTER]: {
    name: 'Starter',
    limits: PLAN_LIMITS[Plan.STARTER],
    ...PLAN_FEATURES[Plan.STARTER],
  },
  [Plan.PRO]: {
    name: 'Pro',
    limits: PLAN_LIMITS[Plan.PRO],
    ...PLAN_FEATURES[Plan.PRO],
  },
  [Plan.BUSINESS]: {
    name: 'Business',
    limits: PLAN_LIMITS[Plan.BUSINESS],
    ...PLAN_FEATURES[Plan.BUSINESS],
  },
  [Plan.ENTERPRISE]: {
    name: 'Enterprise',
    limits: PLAN_LIMITS[Plan.ENTERPRISE],
    ...PLAN_FEATURES[Plan.ENTERPRISE],
  },
};

// Features - string map for use with decorators
export enum Feature {
  ADVANCED_SCAN = 'hasAdvancedScan',
  HISTORICAL_SCAN = 'hasHistoricalScan',
  CUSTOM_RULES = 'hasCustomRules',
  SCHEDULED_SCANS = 'hasScheduledScans',
  API_ACCESS = 'hasApiAccess',
  REPORTING = 'hasReporting',
  EXPORT_REPORTS = 'hasExportReports',
  TEAM_MANAGEMENT = 'hasTeamManagement',
  SSO_LOGIN = 'hasSsoLogin',
  ROLE_CUSTOMIZATION = 'hasRoleCustomization',
  AUDIT_LOG = 'hasAuditLog',
  PRIORITY_SUPPORT = 'hasPrioritySuppport',
}

// Resource and limit types for usage tracking
export enum ResourceType {
  SCAN = 'SCAN',
  WORKSPACE = 'WORKSPACE',
  REPOSITORY = 'REPOSITORY',
  USER = 'USER',
  ALERT = 'ALERT',
  SCHEDULE = 'SCHEDULE',
}

export enum LimitType {
  SCANS_PER_DAY = 'scansPerDay',
  SCANS_PER_MONTH = 'scansPerMonth',
  USERS_PER_WORKSPACE = 'usersPerWorkspace',
  MAX_WORKSPACES = 'maxWorkspaces',
  MAX_REPOSITORIES = 'maxRepositories',
  MAX_HISTORY_DAYS = 'maxHistoryDays',
  MAX_ALERTS = 'maxAlerts',
}

// Plan upgrade messaging
export const PLAN_UPGRADE_MESSAGES = {
  [Feature.ADVANCED_SCAN]: 'Upgrade to Pro plan or higher to access advanced scanning features.',
  [Feature.HISTORICAL_SCAN]: 'Upgrade to Pro plan or higher to access historical scanning.',
  [Feature.CUSTOM_RULES]: 'Upgrade to Business plan or higher to create custom security rules.',
  [Feature.SCHEDULED_SCANS]: 'Upgrade to Pro plan or higher to schedule automated scans.',
  [Feature.API_ACCESS]: 'Upgrade to Pro plan or higher to access the API.',
  [Feature.EXPORT_REPORTS]: 'Upgrade to Pro plan or higher to export reports.',
  [Feature.TEAM_MANAGEMENT]: 'Upgrade to Pro plan or higher to manage team members.',
  [Feature.SSO_LOGIN]: 'Upgrade to Business plan or higher to use SSO login.',
  [Feature.ROLE_CUSTOMIZATION]: 'Upgrade to Business plan or higher to customize roles.',
  [Feature.AUDIT_LOG]: 'Upgrade to Business plan or higher to access audit logs.',
  [Feature.PRIORITY_SUPPORT]: 'Upgrade to Enterprise plan to get priority support.',
  
  [LimitType.SCANS_PER_DAY]: 'You have reached your daily scan limit. Upgrade your plan for more scans per day.',
  [LimitType.SCANS_PER_MONTH]: 'You have reached your monthly scan limit. Upgrade your plan for more scans per month.',
  [LimitType.USERS_PER_WORKSPACE]: 'You have reached the maximum users per workspace. Upgrade your plan to add more users.',
  [LimitType.MAX_WORKSPACES]: 'You have reached the maximum number of workspaces. Upgrade your plan to create more workspaces.',
  [LimitType.MAX_REPOSITORIES]: 'You have reached the maximum number of repositories. Upgrade your plan to add more repositories.',
  [LimitType.MAX_HISTORY_DAYS]: 'Your plan has limited scan history. Upgrade for longer history retention.',
  [LimitType.MAX_ALERTS]: 'You have reached the maximum number of alerts. Upgrade your plan to create more alerts.',
};
