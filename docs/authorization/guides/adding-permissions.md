# Guide: Adding New Permissions

This guide explains how to add new permissions to the CodeDefender system.

## Permission Structure

Permissions in CodeDefender follow the format: `RESOURCE:ACTION`

For example:
- `SCAN:CREATE`: Permission to create security scans
- `REPORT:READ`: Permission to view security reports
- `USER:MANAGE`: Permission to fully manage users

## Step 1: Define Permission Constants

All permissions should be defined as constants in the central permissions file:

```typescript
// src/authorization/constants/permissions.constants.ts

export const PERMISSION_CODES = {
  // Existing permissions...
  
  // Add your new permission
  MY_RESOURCE_CREATE: 'MY_RESOURCE:CREATE',
  MY_RESOURCE_READ: 'MY_RESOURCE:READ',
  MY_RESOURCE_UPDATE: 'MY_RESOURCE:UPDATE',
  MY_RESOURCE_DELETE: 'MY_RESOURCE:DELETE',
};
```

## Step 2: Update Permission Seed Data

Add the new permission to the permission seed data:

```typescript
// prisma/seeds/permissions.seed.ts

export const permissionsSeedData: Prisma.PermissionCreateInput[] = [
  // Existing permissions...
  
  // Add your new permissions
  {
    code: PERMISSION_CODES.MY_RESOURCE_CREATE,
    name: 'Create My Resource',
    description: 'Ability to create new my-resources',
  },
  {
    code: PERMISSION_CODES.MY_RESOURCE_READ,
    name: 'View My Resource',
    description: 'Ability to view my-resources',
  },
  // Add other permissions for your resource...
];
```

## Step 3: Assign Permissions to Roles

Decide which roles should have the new permissions:

```typescript
// prisma/seeds/roles.seed.ts

export const rolePermissionsSeedData: RolePermissionSeedData[] = [
  // Super Admin has all permissions
  {
    roleName: ROLE_NAMES.SUPER_ADMIN,
    permissions: Object.values(PERMISSION_CODES),
  },
  
  // Owner has workspace-scoped permissions
  {
    roleName: ROLE_NAMES.WORKSPACE_OWNER,
    permissions: [
      // Existing permissions...
      PERMISSION_CODES.MY_RESOURCE_CREATE,
      PERMISSION_CODES.MY_RESOURCE_READ,
      PERMISSION_CODES.MY_RESOURCE_UPDATE,
      PERMISSION_CODES.MY_RESOURCE_DELETE,
    ],
  },
  
  // Admin has most permissions
  {
    roleName: ROLE_NAMES.WORKSPACE_ADMIN,
    permissions: [
      // Existing permissions...
      PERMISSION_CODES.MY_RESOURCE_CREATE,
      PERMISSION_CODES.MY_RESOURCE_READ,
      PERMISSION_CODES.MY_RESOURCE_UPDATE,
      PERMISSION_CODES.MY_RESOURCE_DELETE,
    ],
  },
  
  // Member has limited permissions
  {
    roleName: ROLE_NAMES.WORKSPACE_MEMBER,
    permissions: [
      // Existing permissions...
      PERMISSION_CODES.MY_RESOURCE_READ,
      // Members might be able to create but not update/delete
      PERMISSION_CODES.MY_RESOURCE_CREATE,
    ],
  },
  
  // Viewer has read-only permissions
  {
    roleName: ROLE_NAMES.WORKSPACE_VIEWER,
    permissions: [
      // Existing permissions...
      PERMISSION_CODES.MY_RESOURCE_READ,
    ],
  },
];
```

## Step 4: Update Documentation

Update the permission documentation to include your new permissions:

1. Add the new resource to the resource list
2. Document any special handling or considerations
3. Update any permission tables or matrices

## Step 5: Run Seed Scripts

Run the seed scripts to apply your changes to the database:

```bash
# From the project root
npm run db:seed
```

## Step 6: Test Permissions

Test the new permissions with different user roles:

1. Create test cases for each permission
2. Verify that each role has the expected permissions
3. Test negative cases (users without permission)

## Best Practices

- **Consistent Naming**: Follow the established `RESOURCE:ACTION` pattern
- **Clear Descriptions**: Write clear descriptions for each permission
- **Granular Permissions**: Create specific, focused permissions rather than broad ones
- **Documentation**: Keep documentation in sync with implemented permissions

## Related Documentation

- [Permission System Overview](../permissions.md)
- [Role Hierarchy](../permissions.md#role-hierarchy)
- [Testing Authorization](../../testing/authorization-testing.md)
