/**
 * BaeMeds Enterprise API Gateway Handler & Structured Response Wrapper
 * Mandated by Section 9: API Contract & Error Handling.
 */

import { ZodSchema, ZodError } from 'zod';
import { AuthenticationError } from '../auth/tokenService.js';
import { AuthorizationError } from '../auth/authorizationMiddleware.js';
import { RateLimiter, RateLimitPolicy, RATE_LIMIT_POLICIES } from './rateLimiter.js';
import { AuditLogger } from '../auditLogger.js';

export interface StructuredErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    timestamp: string;
    details?: unknown;
  };
}

export const createApiResponse = (
  data: unknown,
  status = 200,
  requestId: string,
  extraHeaders?: Record<string, string>
): Response => {
  const headers = new Headers(extraHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Request-Id', requestId);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
};

export const formatErrorResponse = (
  error: unknown,
  requestId: string,
  clientIp = '127.0.0.1'
): Response => {
  const timestamp = new Date().toISOString();

  // 1. ZOD VALIDATION ERROR
  if (error instanceof ZodError) {
    const formatted = error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return createApiResponse(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted request payload failed schema validation.',
          requestId,
          timestamp,
          details: formatted,
        },
      },
      400,
      requestId
    );
  }

  // 2. AUTHENTICATION ERROR (401)
  if (error instanceof AuthenticationError || (error as any)?.name === 'AuthenticationError') {
    const err = error as AuthenticationError;
    return createApiResponse(
      {
        error: {
          code: err.code || 'AUTHENTICATION_REQUIRED',
          message: err.message,
          requestId,
          timestamp,
        },
      },
      err.status || 401,
      requestId
    );
  }

  // 3. AUTHORIZATION ERROR (403)
  if (error instanceof AuthorizationError || (error as any)?.name === 'AuthorizationError') {
    const err = error as AuthorizationError;
    return createApiResponse(
      {
        error: {
          code: err.code || 'FORBIDDEN',
          message: err.message,
          requestId,
          timestamp,
          details: err.details,
        },
      },
      err.status || 403,
      requestId
    );
  }

  // 4. RATE LIMIT ERROR
  if ((error as any)?.code === 'RATE_LIMITED') {
    return createApiResponse(
      {
        error: {
          code: 'RATE_LIMITED',
          message: (error as Error).message,
          requestId,
          timestamp,
        },
      },
      429,
      requestId,
      { 'Retry-After': String((error as any).retryAfter || 60) }
    );
  }

  // 5. UNEXPECTED / INTERNAL SYSTEM ERROR (500)
  // CRITICAL RULE: Red-line mask all database errors, stack traces, and system secrets!
  const errorMessage = error instanceof Error ? error.message : String(error);
  AuditLogger.logEvent({
    actor: 'system',
    action: 'INTERNAL_SERVER_ERROR',
    resource: 'api_gateway',
    result: 'FAILURE',
    metadata: {
      requestId,
      clientIp,
      internalError: errorMessage,
    },
  });

  return createApiResponse(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred. Technical details have been logged.',
        requestId,
        timestamp,
      },
    },
    500,
    requestId
  );
};

/**
 * Validate request body against a Zod schema
 */
export const validateBody = async <T>(request: Request, schema: ZodSchema<T>): Promise<T> => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new AuthenticationError('Request content-type must be application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE');
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ZodError([
      {
        code: 'custom',
        message: 'Invalid JSON payload in request body.',
        path: ['body'],
      },
    ]);
  }

  return schema.parse(raw);
};

/**
 * Apply rate limit policy check to a request
 */
export const enforceRateLimit = (
  request: Request,
  policy: RateLimitPolicy = RATE_LIMIT_POLICIES.default,
  customKey?: string
): void => {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateKey = customKey || `${policy.policyName}:${clientIp}`;
  const check = RateLimiter.check(rateKey, policy);

  if (!check.allowed) {
    const error: any = new Error(`Rate limit exceeded for ${policy.policyName}. Try again in ${check.resetSeconds} seconds.`);
    error.code = 'RATE_LIMITED';
    error.retryAfter = check.resetSeconds;
    throw error;
  }
};
