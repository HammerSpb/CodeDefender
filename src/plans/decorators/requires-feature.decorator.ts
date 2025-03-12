import { SetMetadata } from '@nestjs/common';
import { Feature, LimitType } from '../constants/plan-features';

export const FEATURE_KEY = 'required_feature';
export const FEATURE_OPTIONS_KEY = 'feature_options';

/**
 * Feature requirement options
 */
export interface FeatureOptions {
  requireAll?: boolean; // If true, all features must be available (AND), otherwise any feature is sufficient (OR)
  errorMessage?: string; // Custom error message
  showUpgradePrompt?: boolean; // Whether to show plan upgrade prompt
  allowSuper?: boolean; // Whether to automatically allow SUPER users regardless of plan
}

/**
 * Decorator to require features that are available in a user's plan
 * @param features Feature or array of features required
 * @param options Feature check options
 */
export const RequiresFeature = (
  features: Feature | Feature[],
  options?: FeatureOptions,
) => {
  const featureArray = Array.isArray(features) ? features : [features];
  const defaultOptions: FeatureOptions = {
    requireAll: true,
    showUpgradePrompt: true,
    allowSuper: true,
    ...options,
  };

  return (target: any, key?: string | symbol, descriptor?: any) => {
    // Class decorator
    if (typeof target === 'function' && !key) {
      SetMetadata(FEATURE_KEY, featureArray)(target);
      SetMetadata(FEATURE_OPTIONS_KEY, defaultOptions)(target);
      return target;
    }
    
    // Method decorator
    if (descriptor) {
      SetMetadata(FEATURE_KEY, featureArray)(target, key as string | symbol, descriptor);
      SetMetadata(FEATURE_OPTIONS_KEY, defaultOptions)(target, key as string | symbol, descriptor);
    }
    
    return descriptor;
  };
};

/**
 * Shorthand decorator requiring ALL features to be available
 */
export const RequiresAllFeatures = (
  features: Feature[],
  options?: Omit<FeatureOptions, 'requireAll'>
) => {
  return RequiresFeature(features, { ...options, requireAll: true });
};

/**
 * Shorthand decorator requiring ANY feature to be available
 */
export const RequiresAnyFeature = (
  features: Feature[],
  options?: Omit<FeatureOptions, 'requireAll'>
) => {
  return RequiresFeature(features, { ...options, requireAll: false });
};

// Limit-checking decorators
export const LIMIT_KEY = 'limit_check';
export const LIMIT_OPTIONS_KEY = 'limit_options';

/**
 * Options for limit checking
 */
export interface LimitOptions {
  errorMessage?: string; // Custom error message
  showUpgradePrompt?: boolean; // Whether to show plan upgrade prompt
  allowSuper?: boolean; // Whether to automatically allow SUPER users regardless of limits
  workspaceIdParam?: string; // Name of the parameter containing workspace ID (for workspace-specific limits)
}

/**
 * Decorator to check if a user has reached their usage limits
 * @param limitType Type of limit to check
 * @param options Limit check options
 */
export const CheckLimit = (
  limitType: LimitType,
  options?: LimitOptions,
) => {
  const defaultOptions: LimitOptions = {
    showUpgradePrompt: true,
    allowSuper: true,
    ...options,
  };

  return (target: any, key?: string | symbol, descriptor?: any) => {
    // Class decorator
    if (typeof target === 'function' && !key) {
      SetMetadata(LIMIT_KEY, limitType)(target);
      SetMetadata(LIMIT_OPTIONS_KEY, defaultOptions)(target);
      return target;
    }
    
    // Method decorator
    if (descriptor) {
      SetMetadata(LIMIT_KEY, limitType)(target, key as string | symbol, descriptor);
      SetMetadata(LIMIT_OPTIONS_KEY, defaultOptions)(target, key as string | symbol, descriptor);
    }
    
    return descriptor;
  };
};
