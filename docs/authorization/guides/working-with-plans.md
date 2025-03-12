# Guide: Working with Plans & Features

This guide explains how to work with subscription plans and feature-based access control in CodeDefender.

## Plan Structure

CodeDefender uses a tiered subscription model:

| Plan | Description |
|------|-------------|
| FREE | Basic access with limited functionality |
| PRO | Enhanced features for professional users |
| BUSINESS | Team-oriented features for small businesses |
| ENTERPRISE | Advanced features for large organizations |

## Feature Categories

Features are categorized by their availability in each plan:

1. **Core Features**: Available in all plans
2. **Professional Features**: Available in PRO and higher plans
3. **Business Features**: Available in BUSINESS and higher plans
4. **Enterprise Features**: Only available in ENTERPRISE plan

## Step 1: Define Features

Features are defined in an enum:

```typescript
// src/plans/enums/feature.enum.ts

export enum Feature {
  // Core Features (FREE+)
  BASIC_SCAN = 'BASIC_SCAN',
  VULNERABILITY_REPORT = 'VULNERABILITY_REPORT',
  
  // Professional Features (PRO+)
  ADVANCED_SCAN = 'ADVANCED_SCAN',
  HISTORICAL_REPORTS = 'HISTORICAL_REPORTS',
  SCHEDULED_SCANS = 'SCHEDULED_SCANS',
  
  // Business Features (BUSINESS+)
  CUSTOM_RULES = 'CUSTOM_RULES',
  SSO_LOGIN = 'SSO_LOGIN',
  AUDIT_LOGS = 'AUDIT_LOGS',
  
  // Enterprise Features (ENTERPRISE only)
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  CUSTOM_INTEGRATIONS = 'CUSTOM_INTEGRATIONS',
}
```

## Step 2: Map Features to Plans

Define which features are available in each plan:

```typescript
// src/plans/constants/plan-features.constants.ts

import { Feature } from '../enums/feature.enum';
import { PlanType } from '../enums/plan-type.enum';

export const PLAN_FEATURES = {
  [PlanType.FREE]: [
    Feature.BASIC_SCAN,
    Feature.VULNERABILITY_REPORT,
  ],
  
  [PlanType.PRO]: [
    // Includes all FREE features
    ...PLAN_FEATURES[PlanType.FREE],
    
    Feature.ADVANCED_SCAN,
    Feature.HISTORICAL_REPORTS,
    Feature.SCHEDULED_SCANS,
  ],
  
  [PlanType.BUSINESS]: [
    // Includes all PRO features
    ...PLAN_FEATURES[PlanType.PRO],
    
    Feature.CUSTOM_RULES,
    Feature.SSO_LOGIN,
    Feature.AUDIT_LOGS,
  ],
  
  [PlanType.ENTERPRISE]: [
    // Includes all BUSINESS features
    ...PLAN_FEATURES[PlanType.BUSINESS],
    
    Feature.PRIORITY_SUPPORT,
    Feature.CUSTOM_INTEGRATIONS,
  ],
};
```

## Step 3: Implement Plan Service

The PlanService provides methods to check feature access:

```typescript
// src/plans/services/plan.service.ts

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
  ) {}

  async getWorkspacePlan(workspaceId: string): Promise<PlanType> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    
    return workspace.plan;
  }

  async hasFeatureAccess(workspaceId: string, feature: Feature): Promise<boolean> {
    const plan = await this.getWorkspacePlan(workspaceId);
    return this.doesPlanIncludeFeature(plan, feature);
  }

  doesPlanIncludeFeature(plan: PlanType, feature: Feature): boolean {
    return PLAN_FEATURES[plan].includes(feature);
  }
}
```

## Step 4: Adding Feature Guards to Endpoints

Use the feature guard to protect premium features:

```typescript
// src/modules/scan/controllers/scan.controller.ts

@Controller('workspaces/:workspaceId/scans')
export class ScanController {
  // Basic scan (available to all plans)
  @Post()
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  createBasicScan() {
    // Implementation...
  }

  // Advanced scan (PRO+ plans only)
  @Post('advanced')
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @RequiresFeature(Feature.ADVANCED_SCAN, {
    errorMessage: 'Advanced scanning requires a Pro plan or higher.',
    upgradePath: '/billing/upgrade',
  })
  createAdvancedScan() {
    // Implementation...
  }

  // Custom rules scan (BUSINESS+ plans only)
  @Post('custom')
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @RequiresFeature(Feature.CUSTOM_RULES, {
    errorMessage: 'Custom rules require a Business plan or higher.',
    upgradePath: '/billing/upgrade',
  })
  createCustomScan() {
    // Implementation...
  }
}
```

## Step 5: Checking Features in Services

You can also check feature access directly in services:

```typescript
// src/modules/scan/services/scan.service.ts

@Injectable()
export class ScanService {
  constructor(
    private planService: PlanService,
    // Other dependencies...
  ) {}

  async createScan(workspaceId: string, createScanDto: CreateScanDto) {
    // For advanced features, verify plan access first
    if (createScanDto.useAdvancedRules) {
      const hasAccess = await this.planService.hasFeatureAccess(
        workspaceId,
        Feature.ADVANCED_SCAN,
      );
      
      if (!hasAccess) {
        throw new FeatureNotAvailableException(
          'Advanced scanning requires a Pro plan or higher.',
          '/billing/upgrade',
        );
      }
    }
    
    // Continue with scan creation...
  }
}
```

## Step 6: Displaying Feature Availability in UI

Provide UI components to show feature availability:

```typescript
// Frontend service example
export class PlanService {
  async getWorkspaceFeatures(workspaceId: string): Promise<Feature[]> {
    const response = await this.apiClient.get(`/api/workspaces/${workspaceId}/plan/features`);
    return response.data.features;
  }
  
  async hasFeatureAccess(workspaceId: string, feature: Feature): Promise<boolean> {
    const features = await this.getWorkspaceFeatures(workspaceId);
    return features.includes(feature);
  }
}

// Component example
@Component({
  selector: 'app-scan-options',
  template: `
    <button *ngIf="hasAdvancedScan" (click)="createAdvancedScan()">
      Advanced Scan
    </button>
    <button *ngIf="!hasAdvancedScan" (click)="showUpgradePath()">
      Advanced Scan (Pro+)
    </button>
  `,
})
export class ScanOptionsComponent {
  hasAdvancedScan = false;
  
  async ngOnInit() {
    const workspaceId = this.route.snapshot.params.workspaceId;
    this.hasAdvancedScan = await this.planService.hasFeatureAccess(
      workspaceId,
      Feature.ADVANCED_SCAN,
    );
  }
  
  showUpgradePath() {
    this.router.navigate(['/billing/upgrade']);
  }
}
```

## Step 7: Testing Feature Access

Test feature access with different plans:

```typescript
describe('PlanService', () => {
  it('should allow advanced scan for PRO plan', async () => {
    // Setup workspace with PRO plan
    const workspace = await createWorkspace({ plan: PlanType.PRO });
    
    const hasAccess = await planService.hasFeatureAccess(
      workspace.id,
      Feature.ADVANCED_SCAN,
    );
    
    expect(hasAccess).toBe(true);
  });
  
  it('should deny advanced scan for FREE plan', async () => {
    // Setup workspace with FREE plan
    const workspace = await createWorkspace({ plan: PlanType.FREE });
    
    const hasAccess = await planService.hasFeatureAccess(
      workspace.id,
      Feature.ADVANCED_SCAN,
    );
    
    expect(hasAccess).toBe(false);
  });
});
```

## Best Practices

1. **Central Feature Definitions**: Keep all feature definitions in a central location
2. **Clear Upgrade Paths**: Provide clear upgrade suggestions when users encounter feature limits
3. **Feature Discoverability**: Make premium features visible but clearly marked
4. **Graceful Degradation**: Design the application to function with missing features
5. **Testing Different Plans**: Test functionality with all plan levels

## Related Documentation

- [Permission System Overview](../permissions.md)
- [Plan Structure Documentation](../../plans/README.md)
- [Usage Limits Implementation](./implementing-limits.md)
