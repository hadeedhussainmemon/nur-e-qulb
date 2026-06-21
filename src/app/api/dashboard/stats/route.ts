import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { PrayerLog } from '@/models/PrayerLog';
import { LastRead } from '@/models/LastRead';
import { FastingLog } from '@/models/FastingLog';
import { QuranBookmark } from '@/models/QuranBookmark';
import { QuranProgress } from '@/models/QuranProgress';
import { UserWazeefah } from '@/models/UserWazeefah';
import { FamilyGroup } from '@/models/FamilyGroup';
import { Wazeefah } from '@/models/Wazeefah';
import { RamadanStats } from '@/models/RamadanStats';
import { MissedPrayer } from '@/models/MissedPrayer';
import { PeriodTracker } from '@/models/PeriodTracker';

// Helper to check if a date was a period cycle day
async function checkIsPeriodDate(userId: any, dateStr: string): Promise<boolean> {
  const matchingCycle = await PeriodTracker.findOne({
    userId,
    startDate: { $lte: dateStr },
    $or: [
      { endDate: { $gte: dateStr } },
      { isActive: true }
    ]
  });
  return !!matchingCycle;
}

// Sync past missed prayers
async function syncPastMissedPrayers(user: any) {
  try {
    // Limit sync to max 14 days ago to avoid slow O(N) DB calls on every dashboard load
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const userStart = new Date(user.createdAt);
    const actualStart = userStart > start ? userStart : start;
    actualStart.setHours(0,0,0,0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    
    if (actualStart > yesterday) return;
    
    const dateStrings: string[] = [];
    const current = new Date(actualStart);
    while (current <= yesterday) {
      dateStrings.push(current.toLocaleDateString('en-CA'));
      current.setDate(current.getDate() + 1);
    }
    
    if (dateStrings.length === 0) return;
    
    const logs = await PrayerLog.find({ userId: user._id, date: { $in: dateStrings } });
    const logsMap = new Map(logs.map(l => [l.date, l]));
    
    for (const dateStr of dateStrings) {
      const isPeriodDay = await checkIsPeriodDate(user._id, dateStr);
      const log = logsMap.get(dateStr);
      
      if (!log) {
        await PrayerLog.create({
          userId: user._id,
          date: dateStr,
          fajr: isPeriodDay ? 'excused' : 'missed',
          dhuhr: isPeriodDay ? 'excused' : 'missed',
          asr: isPeriodDay ? 'excused' : 'missed',
          maghrib: isPeriodDay ? 'excused' : 'missed',
          isha: isPeriodDay ? 'excused' : 'missed',
          completionPercentage: isPeriodDay ? 100 : 0
        });
        
        if (!isPeriodDay) {
          for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
            await MissedPrayer.findOneAndUpdate(
              { userId: user._id, prayerName: p } as any,
              { $inc: { count: 1 } },
              { upsert: true }
            );
          }
        }
      } else {
        const logAny = log as any;
        let updated = false;
        for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
          if (logAny[p] === 'pending') {
            logAny[p] = isPeriodDay ? 'excused' : 'missed';
            updated = true;
            if (!isPeriodDay) {
              await MissedPrayer.findOneAndUpdate(
                { userId: user._id, prayerName: p } as any,
                { $inc: { count: 1 } },
                { upsert: true }
              );
            }
          }
        }
        
        if (updated) {
          const list = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
          const done = list.filter(status => status === 'completed' || status === 'excused').length;
          log.completionPercentage = Math.round((done / 5) * 100);
          await log.save();
        }
      }
    }
  } catch (error) {
    console.error('Error syncing past missed prayers:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toLocaleDateString('en-CA');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Sync missed prayers ONLY if not already synced today (Caching mechanism)
    if (user.lastPrayerSyncDate !== dateStr) {
      await syncPastMissedPrayers(user);
      await User.updateOne({ _id: user._id }, { $set: { lastPrayerSyncDate: dateStr } });
    }

    const isPeriodDay = await checkIsPeriodDate(user._id, dateStr);
    let prayerLog = await PrayerLog.findOne({ userId: user._id, date: dateStr });
    if (!prayerLog) {
      prayerLog = await PrayerLog.create({
        userId: user._id,
        date: dateStr,
        fajr: isPeriodDay ? 'excused' : 'pending',
        dhuhr: isPeriodDay ? 'excused' : 'pending',
        asr: isPeriodDay ? 'excused' : 'pending',
        maghrib: isPeriodDay ? 'excused' : 'pending',
        isha: isPeriodDay ? 'excused' : 'pending',
        completionPercentage: 0
      });
    }

    // 2. Fetch streaks (last 60 days of prayer logs)
    const logs = await PrayerLog.find({ userId: user._id }).lean().sort({ date: -1 }).limit(60);
    const logsMap = new Map(logs.map(l => [l.date, l]));
    let currentStreak = 0;
    let fajrStreak = 0;
    let streakBroken = false;
    let fajrStreakBroken = false;
    let today = new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      today = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const loopDateStr = `${y}-${m}-${d}`;

      const log = logsMap.get(loopDateStr);
      const isPeriod = await checkIsPeriodDate(user._id, loopDateStr);

      if (isPeriod) continue;

      if (i === 0) {
        if (log) {
          const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
          const allOk = prayers.every(p => p === 'completed' || p === 'excused');
          if (allOk) currentStreak++;
          if (log.fajr === 'completed' || log.fajr === 'excused') fajrStreak++;
        }
        continue;
      }

      if (!streakBroken) {
        if (log) {
          const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
          const allOk = prayers.every(p => p === 'completed' || p === 'excused');
          if (allOk) {
            currentStreak++;
          } else {
            streakBroken = true;
          }
        } else {
          streakBroken = true;
        }
      }

      if (!fajrStreakBroken) {
        if (log && (log.fajr === 'completed' || log.fajr === 'excused')) {
          fajrStreak++;
        } else {
          fajrStreakBroken = true;
        }
      }

      if (streakBroken && fajrStreakBroken) break;
    }

    // Fetch independent queries in parallel
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
      lastRead,
      totalFasts,
      bookmarksCount,
      userWazeefahs,
      approvedWazeefahs
    ] = await Promise.all([
      LastRead.findOne({ userId: user._id }).lean(),
      FastingLog.countDocuments({
        userId: user._id,
        status: 'completed',
        date: { $gte: startOfYear }
      } as any),
      QuranBookmark.countDocuments({ userId: user._id }),
      UserWazeefah.find({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean(),
      Wazeefah.find({ isApproved: true }).populate('submittedBy', 'name').sort({ createdAt: -1 }).lean()
    ]);

    // 6. Quran Progress (Juz & Khatm Tracker)
    let quranProgress = await QuranProgress.findOne({ userId: user._id }).lean();
    if (!quranProgress) {
      const juzProgress = Array.from({ length: 30 }, (_, i) => ({
        juzNumber: i + 1,
        completed: false,
      }));
      quranProgress = await QuranProgress.create({
        userId: user._id,
        juzProgress,
        khatmCount: 0,
        overallPercentage: 0,
      });
    }

    // 8. Family details
    let familyDetails = null;
    if (user.familyId) {
      const group = await FamilyGroup.findById(user.familyId).populate('members', 'name email role');
      if (group) {
        const enrichedMembers = await Promise.all(group.members.map(async (member: any) => {
          const log = await PrayerLog.findOne({ userId: member._id, date: dateStr }).lean();
          let todayCompletion = 0;
          if (log) {
            const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
            const done = prayers.filter(p => p === 'completed' || p === 'excused').length;
            todayCompletion = Math.round((done / 5) * 100);
          }

          const lastWeekLogs = await PrayerLog.find({
            userId: member._id,
            date: { $lte: dateStr }
          }).sort({ date: -1 }).limit(7).lean();
          
          let weekCompleted = 0;
          lastWeekLogs.forEach((wl: any) => {
            const prayers = [wl.fajr, wl.dhuhr, wl.asr, wl.maghrib, wl.isha];
            weekCompleted += prayers.filter(p => p === 'completed').length;
          });

          return {
            ...JSON.parse(JSON.stringify(member)),
            analytics: { todayCompletion, weekCompleted }
          };
        }));
        familyDetails = JSON.parse(JSON.stringify(group));
        familyDetails.members = enrichedMembers;
      }
    }

    // (Approved Wazeefahs fetched in Promise.all above)

    return NextResponse.json({
      streaks: { currentStreak, fajrStreak },
      prayerLog,
      lastRead,
      totalFasts,
      bookmarksCount,
      quranProgress,
      userWazeefahs,
      familyDetails,
      approvedWazeefahs
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
