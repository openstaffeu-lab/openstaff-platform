import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitMetadata,
} from './rate-limit.decorator';

type BucketState = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly buckets = new Map<string, BucketState>();

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<RateLimitMetadata | undefined>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.buildBucketKey(metadata.key, request);
    const windowMs = metadata.windowMs ?? this.getWindowMs();
    const maxRequests = metadata.maxRequests ?? this.getMaxRequests();
    const now = Date.now();
    const current = RateLimitGuard.buckets.get(key);

    if (!current || current.resetAt <= now) {
      RateLimitGuard.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (current.count >= maxRequests) {
      await this.auditService.logSecurityEvent({
        userId: request?.user?.sub ?? null,
        type: 'RATE_LIMIT_TRIGGERED' as any,
        category: metadata.key.toUpperCase(),
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.route?.path ?? request?.url ?? ''}`,
        message: `Rate limit triggered for ${metadata.key}`,
        metadata: {
          route: request?.route?.path ?? request?.url ?? '',
          maxRequests,
          windowMs,
        },
        request,
      });

      throw new HttpException({
        message: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
      }, 429);
    }

    current.count += 1;
    RateLimitGuard.buckets.set(key, current);
    return true;
  }

  private buildBucketKey(scope: string, request: any) {
    const actor = request?.user?.sub ?? request?.ip ?? request?.headers?.['x-forwarded-for'] ?? 'anonymous';
    return `${scope}:${actor}`;
  }

  private getWindowMs() {
    const raw = Number(process.env.RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_WINDOW_MS;
  }

  private getMaxRequests() {
    const raw = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? DEFAULT_MAX_REQUESTS);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_REQUESTS;
  }
}
