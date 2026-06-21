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

    // Fetch all on the server. Since we already have the session,
    // this avoids parallel getServerSession calls from multiple HTTP requests.
    const [
      streaks,
      log,
      readData,
      fastingData,
      bookmarks,
      progress,
      wazeefahs,
      familyData,
      approvedWazeefahs
    ] = await Promise.all([
      getPrayerStreaks(localTodayDateString).catch(() => ({ currentStreak: 0, fajrStreak: 0 })),
      getTodayPrayerLog(localTodayDateString).catch(() => null),
      getLastRead().catch(() => null),
      getFastingSummary().catch(() => ({ totalFasts: 0 })),
      getQuranBookmarks().catch(() => []),
      getQuranProgress().catch(() => null),
      getUserWazeefahs().catch(() => []),
      getFamilyDetails().catch(() => null),
      getApprovedWazeefahs().catch(() => [])
    ]);

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
