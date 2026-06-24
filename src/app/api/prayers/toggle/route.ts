import { NextRequest, NextResponse } from 'next/server';
import { togglePrayerStatus } from '@/app/actions/prayerActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, prayer, status } = body;
    
    if (!date || !prayer || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Since this is called from the Service Worker, the browser automatically sends
    // the HttpOnly session cookies, so NextAuth inside togglePrayerStatus will authenticate it.
    const result = await togglePrayerStatus(date, prayer, status);
    
    if (result.success) {
      return NextResponse.json({ success: true, log: result.log });
    } else {
      return NextResponse.json({ error: 'Failed to toggle prayer status' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /api/prayers/toggle error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
