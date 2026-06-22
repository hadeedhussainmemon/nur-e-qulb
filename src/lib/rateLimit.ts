import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { RateLimit } from '@/models/RateLimit';

export async function checkRateLimit(req: NextRequest | Request, endpoint: string, limit: number, windowMs: number): Promise<{ success: boolean; limit: number; remaining: number }> {
  try {
    await connectToDatabase();
    
    // Attempt to extract IP from common proxy headers
    let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // If multiple IPs are forwarded, take the first one
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);

    // Find and update or insert new rate limit document
    const record = await RateLimit.findOneAndUpdate(
      { ip, endpoint },
      {
        $setOnInsert: { expiresAt },
        $inc: { count: 1 }
      },
      { upsert: true, new: true }
    );

    const isRateLimited = record.count > limit;
    const remaining = Math.max(0, limit - record.count);

    return { success: !isRateLimited, limit, remaining };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open if the DB has a temporary issue, to not block legitimate users
    return { success: true, limit, remaining: limit - 1 };
  }
}
