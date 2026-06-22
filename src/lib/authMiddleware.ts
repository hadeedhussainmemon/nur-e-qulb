import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Middleware to protect API routes with authentication and rate limiting
 * Usage: 
 * export const middleware = withAuthAndRateLimit(handler, { 
 *   rateLimit: { limit: 30, window: 60000 },
 *   requireAdmin: false
 * })
 */

interface MiddlewareOptions {
  rateLimit?: {
    limit: number;
    window: number;
  };
  requireAdmin?: boolean;
  endpointName?: string;
}

export async function withAuthAndRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest) => {
    try {
      // 1. Authentication Check
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Admin Check (if required)
      if (options.requireAdmin && (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // 3. Rate Limiting
      if (options.rateLimit) {
        const endpointName = options.endpointName || req.nextUrl.pathname;
        const rateLimit = await checkRateLimit(
          req,
          endpointName,
          options.rateLimit.limit,
          options.rateLimit.window
        );

        if (!rateLimit.success) {
          return NextResponse.json(
            { 
              error: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil(options.rateLimit.window / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil(options.rateLimit.window / 1000).toString()
              }
            }
          );
        }

        // Add rate limit info to headers (optional, for client awareness)
        const response = await handler(req);
        response.headers.set('X-RateLimit-Limit', options.rateLimit.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        return response;
      }

      return handler(req);
    } catch (error: any) {
      console.error('Middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Extract user ID from session
 */
export async function getUserIdFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}
