import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const timestamp = new Date().toISOString();
    
    // Log request start in JSON
    console.log(JSON.stringify({ level: 'info', type: 'request_start', method, url, timestamp }));
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      const status = response.status;
      
      // Log request completion in JSON
      console.log(JSON.stringify({ level: 'info', type: 'request_end', method, url, status, durationMs: duration, timestamp: new Date().toISOString() }));
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - start;
      
      // Log errors in JSON
      console.error(JSON.stringify({ 
        level: 'error', 
        type: 'request_error', 
        method, 
        url, 
        durationMs: duration, 
        error: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString() 
      }));
      
      throw error;
    }
  };
}
