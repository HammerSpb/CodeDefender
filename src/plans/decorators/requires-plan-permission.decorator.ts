import { SetMetadata } from '@nestjs/common';

export const PLAN_PERMISSION_KEY = 'required_plan_permission';

export const RequiresPlanPermission = (permission: string) =>
  SetMetadata(PLAN_PERMISSION_KEY, permission);
