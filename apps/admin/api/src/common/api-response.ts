import { Prisma } from '@prisma/client';

export type StructuredSuccessResponse<T> = {
  status: 'ok';
  data: T;
  source?: 'database' | 'placeholder' | 'integrated-fallback';
};

export type StructuredErrorResponse = {
  status: 'error';
  message: string;
  code?: string;
  requestId?: string | null;
  details?: string;
};

export function buildSuccessResponse<T>(
  data: T,
  source: 'database' | 'placeholder' | 'integrated-fallback' = 'database',
): StructuredSuccessResponse<T> {
  return {
    status: 'ok',
    data,
    source,
  };
}

export function buildErrorResponse(
  message: string,
  details?: string,
  code?: string,
  requestId?: string | null,
): StructuredErrorResponse {
  return {
    status: 'error',
    message,
    ...(code
      ? {
          code,
        }
      : {}),
    ...(requestId !== undefined
      ? {
          requestId,
        }
      : {}),
    ...(details
      ? {
          details,
        }
      : {}),
  };
}

export function buildInternalErrorResponse(
  error: unknown,
): StructuredErrorResponse {
  return buildErrorResponse(
    'Internal server error',
    process.env.NODE_ENV !== 'production' ? getErrorDetails(error) : undefined,
    'INTERNAL_ERROR',
  );
}

export function isPrismaConnectionOrSchemaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P2021', 'P2022'].includes(error.code);
  }

  const details = getErrorDetails(error).toLowerCase();
  return (
    (details.includes('table') && details.includes('does not exist')) ||
    details.includes("can't reach database server")
  );
}

export function logEndpointError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}

export function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
