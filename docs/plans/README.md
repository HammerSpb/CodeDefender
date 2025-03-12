# CodeDefender Plans

This document outlines the plan structure and features available in different subscription tiers of CodeDefender.

## Plan Types

CodeDefender offers four subscription plans:

1. **STARTER** - Basic security scanning for individuals and small teams
2. **PRO** - Enhanced scanning and reporting for growing teams
3. **BUSINESS** - Advanced security features for larger organizations
4. **ENTERPRISE** - Complete security solution with custom features for enterprises

## Plan Features Matrix

| Feature | STARTER | PRO | BUSINESS | ENTERPRISE |
|---------|---------|-----|----------|------------|
| Basic Scanning | ✅ | ✅ | ✅ | ✅ |
| Advanced Scanning | ❌ | ✅ | ✅ | ✅ |
| Historical Scanning | ❌ | ✅ | ✅ | ✅ |
| Custom Rules | ❌ | ❌ | ✅ | ✅ |
| Scheduled Scans | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Basic Reporting | ✅ | ✅ | ✅ | ✅ |
| Export Reports | ❌ | ✅ | ✅ | ✅ |
| Team Management | ❌ | ✅ | ✅ | ✅ |
| SSO Login | ❌ | ❌ | ✅ | ✅ |
| Role Customization | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |

## Plan Limits

| Limit | STARTER | PRO | BUSINESS | ENTERPRISE |
|-------|---------|-----|----------|------------|
| Scans per Day | 5 | 20 | 50 | 100 |
| Scans per Month | 30 | 200 | 500 | 1000 |
| Users per Workspace | 3 | 10 | 30 | 100 |
| Max Workspaces | 1 | 3 | 10 | 100 |
| Max Repositories | 5 | 20 | 50 | 500 |
| History Retention (days) | 14 | 30 | 90 | 365 |
| Max Alerts | 100 | 500 | 1000 | 5000 |

## Available Roles

| Role | STARTER | PRO | BUSINESS | ENTERPRISE |
|------|---------|-----|----------|------------|
| Super Admin | 🔒 | 🔒 | 🔒 | 🔒 |
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ❌ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ | ✅ |
| Support | ❌ | ❌ | ❌ | ✅ |
| Viewer | ✅ | ✅ | ✅ | ✅ |

*Note: Super Admin role is a system role and not available to regular users.*

## Plan-Based Access Control System

CodeDefender implements a comprehensive plan-based access control system that combines:

1. **Role-Based Permissions**: Determines what actions a user can perform based on their assigned role
2. **Plan-Based Features**: Controls feature availability based on subscription tier
3. **Usage Limits**: Enforces resource usage restrictions based on plan limits

### How It Works

The system uses several components to enforce access control:

- **Permission Checks**: Verifies a user has the necessary role-based permission for an action
- **Feature Checks**: Validates the user's plan includes the required feature
- **Limit Checks**: Ensures the user has not exceeded plan-specific usage limits
- **Unified Policy Guard**: Combines all checks to provide comprehensive security enforcement

### Usage Tracking

The system tracks resource usage to:

- Monitor compliance with plan limits
- Provide usage analytics to users
- Support plan upgrade recommendations

### Guards and Decorators

Developers can control access to endpoints and features using decorators:

```typescript
// Require a specific feature
@RequiresFeature(Feature.ADVANCED_SCAN)
scanRepository() { ... }

// Check usage limits
@CheckLimit(LimitType.SCANS_PER_DAY)
runScan() { ... }

// Unified policy check (permission + feature + limit)
@RequiresPolicy({
  permissionCode: PERMISSION_CODES.SCAN_EXECUTE,
  requiredFeatures: [Feature.ADVANCED_SCAN],
  limitType: LimitType.SCANS_PER_DAY
})
executeAdvancedScan() { ... }
```

## Upgrading Plans

Users can upgrade their subscription plan to access additional features and higher usage limits. When a user attempts to use a feature not available in their current plan, the system provides an upgrade prompt with specific information about the required plan.
