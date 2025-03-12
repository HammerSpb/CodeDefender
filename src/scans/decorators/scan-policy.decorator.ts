import { applyDecorators, UseGuards } from '@nestjs/common';
import { RequiresPermission } from '../../permissions/decorators/requires-permission.decorator';
import { RequiresFeature, CheckLimit } from '../../plans/decorators/requires-feature.decorator';
import { Feature, LimitType } from '../../plans/constants/plan-features';
import { PERMISSION_CODES } from '../../permissions/constants/permission-codes';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { FeatureGuard } from '../../plans/guards/feature.guard';
import { LimitGuard } from '../../plans/guards/limit.guard';

/**
 * Combined decorator for scan creation
 * Checks both permissions and plan features
 */
export const CanCreateScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_CREATE),
    CheckLimit(LimitType.SCANS_PER_DAY, { workspaceIdParam: 'workspace_id' }),
    UseGuards(PermissionGuard, LimitGuard)
  );
};

/**
 * Decorator for advanced scan features
 */
export const CanCreateAdvancedScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_CREATE),
    RequiresFeature(Feature.ADVANCED_SCAN, {
      errorMessage: 'Advanced scanning requires a Pro plan or higher.',
      showUpgradePrompt: true,
    }),
    CheckLimit(LimitType.SCANS_PER_DAY, { workspaceIdParam: 'workspace_id' }),
    UseGuards(PermissionGuard, FeatureGuard, LimitGuard)
  );
};

/**
 * Decorator for historical scan access
 */
export const CanAccessHistoricalScans = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_READ),
    RequiresFeature(Feature.HISTORICAL_SCAN, {
      errorMessage: 'Historical scanning requires a Pro plan or higher.',
      showUpgradePrompt: true,
    }),
    UseGuards(PermissionGuard, FeatureGuard)
  );
};

/**
 * Decorator for scheduled scan creation
 */
export const CanCreateScheduledScan = () => {
  return applyDecorators(
    RequiresPermission([PERMISSION_CODES.SCAN_CREATE, PERMISSION_CODES.SCHEDULE_CREATE], { requireAll: true }),
    RequiresFeature(Feature.SCHEDULED_SCANS, {
      errorMessage: 'Scheduled scanning requires a Pro plan or higher.',
      showUpgradePrompt: true,
    }),
    UseGuards(PermissionGuard, FeatureGuard)
  );
};

/**
 * Decorator for viewing scan details
 */
export const CanViewScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_READ),
    UseGuards(PermissionGuard)
  );
};

/**
 * Decorator for running a scan
 */
export const CanRunScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_EXECUTE),
    CheckLimit(LimitType.SCANS_PER_DAY, { workspaceIdParam: 'workspace_id' }),
    UseGuards(PermissionGuard, LimitGuard)
  );
};

/**
 * Decorator for deleting a scan
 */
export const CanDeleteScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_DELETE),
    UseGuards(PermissionGuard)
  );
};
