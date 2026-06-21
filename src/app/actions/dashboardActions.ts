'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { getPrayerStreaks, getTodayPrayerLog } from '@/app/actions/prayerActions';
import { getLastRead } from '@/app/actions/lastReadActions';
import { getFastingSummary } from '@/app/actions/fastingActions';
import { getQuranBookmarks } from '@/app/actions/bookmarkActions';
import { getQuranProgress } from '@/app/actions/quranProgressActions';
import { getUserWazeefahs } from '@/app/actions/userWazeefahActions';
import { getFamilyDetails } from '@/app/actions/familyActions';
import { getApprovedWazeefahs } from '@/app/actions/wazeefahActions';

export async function getDashboardData(localTodayDateString: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    // Fetch all sequentially on the server. Since they are run sequentially,
    // only one getServerSession is executing at any time, preventing parallel session locks.
    const streaks = await getPrayerStreaks(localTodayDateString).catch(() => ({ currentStreak: 0, fajrStreak: 0 }));
    const log = await getTodayPrayerLog(localTodayDateString).catch(() => null);
    const readData = await getLastRead().catch(() => null);
    const fastingData = await getFastingSummary().catch(() => ({ totalFasts: 0 }));
    const bookmarks = await getQuranBookmarks().catch(() => []);
    const progress = await getQuranProgress().catch(() => null);
    const wazeefahs = await getUserWazeefahs().catch(() => []);
    const familyData = await getFamilyDetails().catch(() => null);
    const approvedWazeefahs = await getApprovedWazeefahs().catch(() => []);

    return {
      success: true,
      data: {
        streaks,
        log,
        readData,
        fastingData,
        bookmarks,
        progress,
        wazeefahs,
        familyData,
        approvedWazeefahs
      }
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: error.message };
  }
}
