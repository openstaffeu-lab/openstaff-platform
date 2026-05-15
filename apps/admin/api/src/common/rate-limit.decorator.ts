import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA_KEY = 'rate_limit_metadata';

export type RateLimitMetadata = {
  key: string;
  maxRequests?: number;
  windowMs?: number;
};

export const RateLimit = (metadata: RateLimitMetadata) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, metadata);
