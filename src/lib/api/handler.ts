/**
 * handler.ts — Standard API route wrapper.
 *
 * Wraps a route handler so:
 *   • Uncaught exceptions become a generic 500 with a request ID instead of
 *     a 500 with a raw stack trace or Postgres constraint name.
 *   • Postgres / Supabase errors are caught and mapped to opaque codes.
 *   • A correlation `x-request-id` is attached so logs can be tied to a
 *     specific failed call without the client seeing internal details.
 *
 * Usage:
 *   export const POST = withApiHandler(async (req, ctx) => {
 *     // ... route logic, return NextResponse or throw ApiError
 *   });
 *
 * AUDIT_REPORT.md → Finding H-19.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'bad_request'
  | 'conflict'
  | 'rate_limited'
  | 'internal';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  bad_request: 400,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiHandlerContext<P = Record<string, string>> {
  params: P;
  requestId: string;
}

export type ApiHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: ApiHandlerContext<P>,
) => Promise<NextResponse> | NextResponse;

function makeRequestId(): string {
  // Edge runtime supports crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Detect Postgres / Supabase error shapes so we can normalize them.
 * We deliberately do NOT include `message`, `details`, or `hint` in the
 * client-visible body — they leak schema and constraint names.
 */
function isPostgresErrorLike(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

/**
 * Convert any caught error into a sanitized JSON response.
 */
function toErrorResponse(err: unknown, requestId: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message }, requestId },
      { status: STATUS_BY_CODE[err.code], headers: { 'x-request-id': requestId } },
    );
  }

  // Postgres-shaped error → 500 with a generic message + correlation id.
  // The full error is logged server-side only; the client sees nothing
  // useful for schema enumeration.
  if (isPostgresErrorLike(err)) {
    console.error(`[api ${requestId}] postgres error`, err);
    return NextResponse.json(
      {
        error: { code: 'internal', message: 'An internal error occurred.' },
        requestId,
      },
      { status: 500, headers: { 'x-request-id': requestId } },
    );
  }

  console.error(`[api ${requestId}] unhandled error`, err);
  return NextResponse.json(
    {
      error: {
        code: 'internal',
        // In dev we keep the raw message for debugging; in prod we never leak.
        message:
          env.NODE_ENV === 'production'
            ? 'An internal error occurred.'
            : err instanceof Error
              ? err.message
              : 'Unknown error',
      },
      requestId,
    },
    { status: 500, headers: { 'x-request-id': requestId } },
  );
}

/**
 * Wrap a Next.js App Router route handler with normalized error handling.
 */
export function withApiHandler<P = Record<string, string>>(
  handler: ApiHandler<P>,
): (request: NextRequest, ctx: { params: P }) => Promise<NextResponse> {
  return async (request, ctx) => {
    const requestId = makeRequestId();
    try {
      const response = await handler(request, {
        params: ctx?.params ?? ({} as P),
        requestId,
      });
      // Always echo the request id back so logs can be correlated.
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (err) {
      return toErrorResponse(err, requestId);
    }
  };
}

/** Convenience: 401 for missing/invalid session. */
export function unauthorized(message = 'Unauthorized.'): never {
  throw new ApiError('unauthorized', message);
}

/** Convenience: 403 for the right user, wrong permission. */
export function forbidden(message = 'Forbidden.'): never {
  throw new ApiError('forbidden', message);
}

/** Convenience: 400 for validation failures. */
export function badRequest(message = 'Bad request.'): never {
  throw new ApiError('bad_request', message);
}
