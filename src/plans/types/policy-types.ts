import { Feature, LimitType } from '../constants/plan-features';

/**
 * Policy options interface for unified policy configuration
 */
export interface PolicyOptions {
  permissionCode?: string;
  requiredFeatures?: Feature[];
  limitType?: LimitType;
  requireAll?: boolean;
  errorMessage?: string;
  showUpgradePrompt?: boolean;
  allowSuper?: boolean;
}

/**
 * Metadata key for policy options
 */
export const POLICY_OPTIONS_KEY = 'policy_options';
