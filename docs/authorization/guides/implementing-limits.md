# Guide: Implementing Usage Limits

This guide explains how to implement and enforce usage limits based on subscription plans in CodeDefender.

## Usage Limit Types

CodeDefender implements several types of usage limits:

| Limit Type | Description |
|------------|-------------|
| SCANS_PER_DAY | Maximum number of security scans per day |
| USERS_PER_WORKSPACE | Maximum number of users in a workspace |
| WORKSPACES_PER_ACCOUNT | Maximum number of workspaces for an account |
| REPOSITORIES_PER_WORKSPACE | Maximum number of repositories per workspace |
| RETENTION_DAYS | Number of days to retain historical data |
| API_REQUESTS_PER_HOUR | API request rate limit |

## Step 1: Define Limit Types

Define the limit types as an enum:

```typescript
// src/plans/enums/limit-type.enum.ts

export enum LimitType {
  SCANS_PER_DAY = 'SCANS_PER_DAY',
  USERS_PER_WORKSPACE = 'USERS_PER_WORKSPACE',
  WORKSPACES_PER_ACCOUNT = 'WORKSPACES_PER_ACCOUNT',
  REPOSITORIES_PER_WORKSPACE = 'REPOSITORIES_PER_WORKSPACE',
  RETENTION_DAYS = 'RETENTION_DAYS',
  API_REQUESTS_PER_HOUR = 'API_REQUESTS_PER_HOUR',
}
```

## Step 2: Configure Plan Limits

Define the limits for each plan:

```typescript
// src/plans/constants/plan-limits.constants.ts

import { LimitType } from '../enums/limit-type.enum';
import { PlanType } from '../enums/plan-type.enum';

export const PLAN_LIMITS = {
  [PlanType.FREE]: {
    [LimitType.SCANS_PER_DAY]: 5,
    [LimitType.USERS_PER_WORKSPACE]: 3,
    [LimitType.WORKSPACES_PER_ACCOUNT]: 1,
    [LimitType.REPOSITORIES_PER_WORKSPACE]: 5,
    [LimitType.RETENTION_DAYS]: 14,
    [LimitType.API_REQUESTS_PER_HOUR]: 50,
  },
  
  [PlanType.PRO]: {
    [LimitType.SCANS_PER_DAY]: 20,
    [LimitType.USERS_PER_WORKSPACE]: 10,
    [LimitType.WORKSPACES_PER_ACCOUNT]: 3,
    [LimitType.REPOSITORIES_PER_WORKSPACE]: 20,
    [LimitType.RETENTION_DAYS]: 30,
    [LimitType.API_REQUESTS_PER_HOUR]: 200,
  },
  
  [PlanType.BUSINESS]: {
    [LimitType.SCANS_PER_DAY]: 50,
    [LimitType.USERS_PER_WORKSPACE]: 30,
    [LimitType.WORKSPACES_PER_ACCOUNT]: 10,
    [LimitType.REPOSITORIES_PER_WORKSPACE]: 50,
    [LimitType.RETENTION_DAYS]: 90,
    [LimitType.API_REQUESTS_PER_HOUR]: 500,
  },
  
  [PlanType.ENTERPRISE]: {
    [LimitType.SCANS_PER_DAY]: 100,
    [LimitType.USERS_PER_WORKSPACE]: 100,
    [LimitType.WORKSPACES_PER_ACCOUNT]: 100,
    [LimitType.REPOSITORIES_PER_WORKSPACE]: 500,
    [LimitType.RETENTION_DAYS]: 365,
    [LimitType.API_REQUESTS_PER_HOUR]: 1000,
  },
};
```

## Step 3: Implement Usage Tracking

Create a service to track and check usage:

```typescript
// src/plans/services/usage.service.ts

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageLog)
    private usageLogRepository: Repository<UsageLog>,
    private planService: PlanService,
  ) {}

  async trackUsage(
    workspaceId: string, 
    userId: string, 
    limitType: LimitType, 
    quantity = 1,
  ): Promise<void> {
    // Record usage event
    await this.usageLogRepository.save({
      workspaceId,
      userId,
      limitType,
      quantity,
      timestamp: new Date(),
    });
  }

  async getCurrentUsage(
    workspaceId: string, 
    limitType: LimitType,
  ): Promise<number> {
    // Implementation depends on the limit type
    switch (limitType) {
      case LimitType.SCANS_PER_DAY:
        return this.getDailyScansCount(workspaceId);
      case LimitType.USERS_PER_WORKSPACE:
        return this.getUsersCount(workspaceId);
      // Other limit types...
    }
  }

  async getDailyScansCount(workspaceId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await this.usageLogRepository.count({
      where: {
        workspaceId,
        limitType: LimitType.SCANS_PER_DAY,
        timestamp: MoreThan(today),
      },
    });
    
    return count;
  }

  async getUsersCount(workspaceId: string): Promise<number> {
    // Count users in workspace (implementation depends on your data model)
    // ...
  }

  async getLimit(
    workspaceId: string, 
    limitType: LimitType,
  ): Promise<number> {
    const plan = await this.planService.getWorkspacePlan(workspaceId);
    return PLAN_LIMITS[plan][limitType];
  }

  async checkUsageLimit(
    workspaceId: string, 
    limitType: LimitType,
  ): Promise<boolean> {
    const currentUsage = await this.getCurrentUsage(workspaceId, limitType);
    const limit = await this.getLimit(workspaceId, limitType);
    
    return currentUsage < limit;
  }

  async getRemainingUsage(
    workspaceId: string, 
    limitType: LimitType,
  ): Promise<number> {
    const currentUsage = await this.getCurrentUsage(workspaceId, limitType);
    const limit = await this.getLimit(workspaceId, limitType);
    
    return Math.max(0, limit - currentUsage);
  }
}
```

## Step 4: Create a Limit Guard

Implement a guard to check usage limits:

```typescript
// src/plans/guards/limit.guard.ts

@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    private usageService: UsageService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<LimitType>(
      'limitType',
      context.getHandler(),
    );
    
    if (!limitType) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params.workspaceId;
    const userId = request.user.id;
    
    const withinLimit = await this.usageService.checkUsageLimit(
      workspaceId,
      limitType,
    );
    
    if (!withinLimit) {
      const limit = await this.usageService.getLimit(workspaceId, limitType);
      const planService = new PlanService(); // Replace with proper DI
      const plan = await planService.getWorkspacePlan(workspaceId);
      
      throw new UsageLimitExceededException(
        `You have reached your ${limitType} limit of ${limit}. Upgrade to a higher plan for increased limits.`,
        '/billing/upgrade',
      );
    }
    
    // Automatically track usage (optional, could also be done in the service)
    await this.usageService.trackUsage(workspaceId, userId, limitType);
    
    return true;
  }
}
```

## Step 5: Create a Limit Decorator

Create a decorator for applying the limit guard:

```typescript
// src/plans/decorators/check-limit.decorator.ts

export interface LimitOptions {
  workspaceIdParam?: string;
  errorMessage?: string;
  upgradePath?: string;
}

export const CheckLimit = (limitType: LimitType, options?: LimitOptions) => {
  return applyDecorators(
    SetMetadata('limitType', limitType),
    SetMetadata('limitOptions', options),
    UseGuards(LimitGuard),
  );
};
```

## Step 6: Apply to Endpoints

Apply the limit decorator to controllers:

```typescript
// src/modules/scan/controllers/scan.controller.ts

@Controller('workspaces/:workspaceId/scans')
export class ScanController {
  @Post()
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @CheckLimit(LimitType.SCANS_PER_DAY, {
    errorMessage: 'You have reached your daily scan limit. Try again tomorrow or upgrade your plan.',
    upgradePath: '/billing/upgrade',
  })
  createScan() {
    // Implementation...
  }
}

// src/modules/workspace/controllers/workspace-user.controller.ts

@Controller('workspaces/:workspaceId/users')
export class WorkspaceUserController {
  @Post()
  @RequiresPermission(PERMISSION_CODES.WORKSPACE_USER_INVITE)
  @CheckLimit(LimitType.USERS_PER_WORKSPACE, {
    errorMessage: 'You have reached the maximum number of users for your plan.',
    upgradePath: '/billing/upgrade',
  })
  inviteUser() {
    // Implementation...
  }
}
```

## Step 7: Display Usage in UI

Create UI components to show usage limits and current usage:

```typescript
// Frontend service example
export class UsageService {
  async getUsageSummary(workspaceId: string): Promise<UsageSummary> {
    const response = await this.apiClient.get(`/api/workspaces/${workspaceId}/usage`);
    return response.data;
  }
}

// Component example
@Component({
  selector: 'app-usage-dashboard',
  template: `
    <div class="usage-card" *ngFor="let limit of usageLimits">
      <h3>{{ limit.name }}</h3>
      <div class="progress-bar">
        <div class="progress" [style.width.%]="limit.usagePercentage"></div>
      </div>
      <p>{{ limit.currentUsage }} of {{ limit.limit }} used</p>
    </div>
    <button *ngIf="showUpgradeButton" (click)="upgradeNow()">
      Upgrade for Higher Limits
    </button>
  `,
})
export class UsageDashboardComponent {
  usageLimits = [];
  showUpgradeButton = false;
  
  async ngOnInit() {
    const workspaceId = this.route.snapshot.params.workspaceId;
    const summary = await this.usageService.getUsageSummary(workspaceId);
    
    this.usageLimits = [
      {
        name: 'Daily Scans',
        currentUsage: summary.scansToday,
        limit: summary.limits.SCANS_PER_DAY,
        usagePercentage: (summary.scansToday / summary.limits.SCANS_PER_DAY) * 100,
      },
      // Other limit types...
    ];
    
    this.showUpgradeButton = this.usageLimits.some(limit => 
      limit.usagePercentage > 80
    );
  }
  
  upgradeNow() {
    this.router.navigate(['/billing/upgrade']);
  }
}
```

## Step 8: Testing Usage Limits

Create tests for usage limits:

```typescript
describe('LimitGuard', () => {
  it('should allow operations within limits', async () => {
    // Setup test with usage below limit
    const workspaceId = 'test-workspace';
    
    // Mock usageService.getCurrentUsage to return a value below limit
    jest.spyOn(usageService, 'getCurrentUsage').mockResolvedValue(3);
    jest.spyOn(usageService, 'getLimit').mockResolvedValue(5);
    
    const result = await limitGuard.canActivate(executionContext);
    
    expect(result).toBe(true);
    expect(usageService.trackUsage).toHaveBeenCalled();
  });
  
  it('should block operations exceeding limits', async () => {
    // Setup test with usage at limit
    const workspaceId = 'test-workspace';
    
    // Mock usageService to show limit exceeded
    jest.spyOn(usageService, 'getCurrentUsage').mockResolvedValue(5);
    jest.spyOn(usageService, 'getLimit').mockResolvedValue(5);
    
    await expect(limitGuard.canActivate(executionContext))
      .rejects
      .toThrow(UsageLimitExceededException);
    
    expect(usageService.trackUsage).not.toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Clear Messaging**: Provide clear error messages when limits are reached
2. **Proactive Notifications**: Warn users as they approach limits
3. **Usage Dashboards**: Create dashboards showing current usage and limits
4. **Upgrade Paths**: Always provide a clear upgrade path when limits are reached
5. **Graceful Handling**: Handle limit exceptions gracefully in the UI
6. **Caching**: Consider caching frequent limit checks for performance

## Related Documentation

- [Plan Structure Documentation](../../plans/README.md)
- [Working with Plans & Features](./working-with-plans.md)
- [Error Handling Guide](../../development/error-handling.md)
