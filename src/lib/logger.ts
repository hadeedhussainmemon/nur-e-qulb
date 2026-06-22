import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;
    
    console.log(`[REQ] ${method} ${url} started`);
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      console.log(`[RES] ${method} ${url} completed in ${duration}ms with status ${response.status}`);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[ERR] ${method} ${url} failed in ${duration}ms:`, error);
      throw error;
    }
  };
}
