import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

function defaultErrorCode(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'VALIDATION_ERROR';
    default:
      return 'INTERNAL_ERROR';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const requestId = request?.requestId ?? request?.headers?.['x-request-id'] ?? null;
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let code = defaultErrorCode(status);
    let details: unknown;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const candidate = exceptionResponse as Record<string, unknown>;
      if (typeof candidate.message === 'string') {
        message = candidate.message;
      } else if (Array.isArray(candidate.message)) {
        message = candidate.message.join('; ');
        details = candidate.message;
      }

      if (typeof candidate.code === 'string') {
        code = candidate.code;
      }
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    response.status(status).json({
      status: 'error',
      message,
      code,
      requestId,
      ...(process.env.NODE_ENV !== 'production' && details
        ? {
            details,
          }
        : {}),
    });
  }
}
