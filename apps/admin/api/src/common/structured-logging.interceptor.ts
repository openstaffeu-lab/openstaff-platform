import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable()
export class StructuredLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpAccess');

  constructor(private readonly runtimeConfig: RuntimeConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (
            !this.runtimeConfig.isDebugLogsEnabled() &&
            !this.runtimeConfig.isProduction
          ) {
            return;
          }

          this.logger.log(
            JSON.stringify({
              requestId: request?.requestId ?? null,
              userId: request?.user?.sub ?? null,
              module: context.getClass().name,
              action: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
              status: response?.statusCode ?? 200,
              durationMs: Date.now() - startedAt,
            }),
          );
        },
        error: (error) => {
          this.logger.error(
            JSON.stringify({
              requestId: request?.requestId ?? null,
              userId: request?.user?.sub ?? null,
              module: context.getClass().name,
              action: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
              status: response?.statusCode ?? 500,
              durationMs: Date.now() - startedAt,
              errorCode: error?.code ?? error?.name ?? 'INTERNAL_ERROR',
            }),
          );
        },
      }),
    );
  }
}
