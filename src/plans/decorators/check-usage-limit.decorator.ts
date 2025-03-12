import { SetMetadata } from '@nestjs/common';

export const USAGE_LIMIT_KEY = 'usage_limit';

export const CheckUsageLimit = (limitType: string) =>
  SetMetadata(USAGE_LIMIT_KEY, limitType);
