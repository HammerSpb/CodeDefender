# Using Plan-Based Access Control

This guide demonstrates how to implement plan-based access control in your CodeDefender controllers and services.

## Available Guards

CodeDefender offers three types of guards:

1. **FeatureGuard** - Checks if a user's plan includes specific features
2. **LimitGuard** - Checks if a user has exceeded usage limits
3. **UnifiedPolicyGuard** - Combines permission, feature, and limit checks

## Available Decorators

### Feature Decorators

```typescript
// Require a single feature
@RequiresFeature(Feature.ADVANCED_SCAN)
myMethod() { ... }

// Require all listed features
@RequiresAllFeatures([
  Feature.ADVANCED_SCAN,
  Feature.CUSTOM_RULES
])
myMethod() { ... }

// Require any of the listed features
@RequiresAnyFeature([
  Feature.EXPORT_REPORTS,
  Feature.API_ACCESS
])
myMethod() { ... }
```

### Limit Decorators

```typescript
// Check if user is within usage limits
@CheckLimit(LimitType.SCANS_PER_DAY)
runScan() { ... }

// With options
@CheckLimit(LimitType.USERS_PER_WORKSPACE, {
  errorMessage: 'You have reached the maximum users for this workspace',
  showUpgradePrompt: true,
  workspaceIdParam: 'workspaceId'
})
addUserToWorkspace() { ... }
```

### Permission Decorators

```typescript
// From permissions module
@RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
createScan() { ... }
```

### Unified Policy Decorators

```typescript
// Complete policy check
@RequiresPolicy({
  permissionCode: PERMISSION_CODES.SCAN_EXECUTE,
  requiredFeatures: [Feature.ADVANCED_SCAN],
  limitType: LimitType.SCANS_PER_DAY,
  showUpgradePrompt: true
})
executeAdvancedScan() { ... }

// Shorthand for permission in plan
@RequiresPlanPermission(PERMISSION_CODES.REPORT_CREATE)
createReport() { ... }

// Shorthand for feature with limit
@RequiresFeatureWithLimit(
  Feature.SCHEDULED_SCANS,
  LimitType.SCANS_PER_DAY
)
scheduleNewScan() { ... }

// Combined policy check
@RequiresCompletePolicy(
  PERMISSION_CODES.REPOSITORY_CREATE,
  Feature.TEAM_MANAGEMENT,
  LimitType.MAX_REPOSITORIES
)
addTeamRepository() { ... }
```

## Usage Tracking

To track feature and resource usage:

```typescript
@Injectable()
export class ScanService {
  constructor(
    private usageService: UsageService,
    private plansService: PlansService,
  ) {}

  async createScan(userId: string, workspaceId: string) {
    // Check if user can create scan
    const canCreate = await this.plansService.userHasFeature(
      userId,
      Feature.ADVANCED_SCAN
    );

    if (!canCreate) {
      throw new ForbiddenException('Your plan does not include advanced scanning');
    }

    // Check usage limits
    const { allowed } = await this.plansService.checkUsageLimit(
      userId,
      LimitType.SCANS_PER_DAY
    );

    if (!allowed) {
      throw new ForbiddenException('Daily scan limit reached');
    }

    // Create scan logic...

    // Track usage
    await this.usageService.trackUsage(
      userId,
      ResourceType.SCAN,
      'CREATE',
      workspaceId
    );

    return scan;
  }
}
```

## Error Handling

When a user doesn't have access to a feature or has reached a limit, the guards will throw a `ForbiddenException` with an appropriate message. You can customize these messages using the options parameter.

```typescript
@RequiresFeature(Feature.CUSTOM_RULES, {
  errorMessage: 'Custom security rules are only available on Business and Enterprise plans',
  showUpgradePrompt: true
})
```

## Usage Statistics and Analytics

The `UsageService` provides methods to retrieve usage statistics:

```typescript
// Get daily scan usage
const scanCount = await usageService.getDailyUsage(userId, ResourceType.SCAN);

// Get monthly usage statistics
const monthlyStats = await usageService.getMonthlyUsage(userId, ResourceType.SCAN);

// Get comprehensive usage statistics
const usageStats = await usageService.getUserUsageStats(
  userId,
  undefined, // all resource types
  startDate,
  endDate
);
```

## Guidelines for Implementation

1. Always use decorators to enforce access control rather than manual checks
2. Track usage for all resource-intensive operations
3. Provide clear upgrade messages when a feature isn't available
4. Use the unified policy guard for complex access control scenarios
5. Test authorization rules with users on different plans
