import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { UserWazeefah } from '@/models/UserWazeefah';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activeWazeefahs = await UserWazeefah.find({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean();
    
    const city = (session?.user as any)?.location?.city || 'Makkah';
    const country = (session?.user as any)?.location?.country || 'Saudi Arabia';
    
    const url = new URL(request.url);
    const dateQuery = url.searchParams.get('date');

    // Fetch daily prayer times directly from third-party API on the server (which is fine) or client
    // To be safe from Vercel outgoing serverless block, let's fetch it, but if it fails we return empty timings
    let prayerTimes = {};
    try {
      const timesRes = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`);
      if (timesRes.ok) {
        const timesData = await timesRes.json();
        prayerTimes = timesData?.data?.timings || {};
      }
    } catch (e) {
      console.error('Failed to fetch prayer times in reminder API:', e);
    }

    let todayLog = null;
    if (dateQuery) {
      const { getTodayPrayerLog } = await import('@/app/actions/prayerActions');
      todayLog = await getTodayPrayerLog(dateQuery);
    }

    return NextResponse.json({
      wazeefahs: activeWazeefahs,
      prayerTimes,
      location: { city, country },
      settings: (session?.user as any)?.settings || null,
      todayLog
    });
  } catch (err: any) {
    console.error('Wazeefah reminder API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
