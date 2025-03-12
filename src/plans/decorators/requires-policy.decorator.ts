import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { UnifiedPolicyGuard } from '../guards/unified-policy.guard';
import { Feature, LimitType } from '../constants/plan-features';
import { PolicyOptions, POLICY_OPTIONS_KEY } from '../types/policy-types';

/**
 * Creates a unified policy that can combine permission, feature, and limit checks
 * @param options Policy options including permissions, features, and limits
 */
export const RequiresPolicy = (options: PolicyOptions) => {
  return applyDecorators(
    SetMetadata(POLICY_OPTIONS_KEY, {
      requireAll: true,
      showUpgradePrompt: true,
      allowSuper: true,
      ...options,
    }),
    UseGuards(UnifiedPolicyGuard)
  );
};

/**
 * Helper decorator for requiring a permission that is available in the user's plan
 * @param permissionCode Permission code
 * @param options Additional policy options
 */
export const RequiresPlanPermission = (
  permissionCode: string,
  options?: Omit<PolicyOptions, 'permissionCode'>
) => {
  return RequiresPolicy({
    permissionCode,
    ...options,
  });
};

/**
 * Helper decorator for requiring a feature and checking a usage limit
 * @param feature Feature required
 * @param limitType Limit to check
 * @param options Additional policy options
 */
export const RequiresFeatureWithLimit = (
  feature: Feature | Feature[],
  limitType: LimitType,
  options?: Omit<PolicyOptions, 'requiredFeatures' | 'limitType'>
) => {
  const featureArray = Array.isArray(feature) ? feature : [feature];
  
  return RequiresPolicy({
    requiredFeatures: featureArray,
    limitType,
    ...options,
  });
};

/**
 * Helper decorator that combines permission, feature, and limit checks
 * @param permissionCode Permission code
 * @param feature Feature required
 * @param limitType Limit to check
 * @param options Additional policy options
 */
export const RequiresCompletePolicy = (
  permissionCode: string,
  feature: Feature | Feature[],
  limitType: LimitType,
  options?: Omit<PolicyOptions, 'permissionCode' | 'requiredFeatures' | 'limitType'>
) => {
  const featureArray = Array.isArray(feature) ? feature : [feature];
  
  return RequiresPolicy({
    permissionCode,
    requiredFeatures: featureArray,
    limitType,
    ...options,
  });
};
