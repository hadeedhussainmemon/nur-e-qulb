'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { PrayerLog } from '@/models/PrayerLog';
import { MissedPrayer } from '@/models/MissedPrayer';
import { PeriodTracker } from '@/models/PeriodTracker';
import mongoose from 'mongoose';
import { isPeriodActive } from '@/app/actions/periodActions';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface AlAdhanResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTimes;
    date: {
      readable: string;
      timestamp: string;
      gregorian: any;
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string };
        year: string;
        designation: { abbreviated: string; expanded: string };
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string };
    };
  };
}

export async function fetchPrayerTimesByCity(city: string, country: string, method: number = 2, school: number = 0): Promise<AlAdhanResponse | null> {
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`, {
      next: { revalidate: 43200 }, // Cache for 12 hours - prayer times don't change hourly
    });

    if (!res.ok) {
      throw new Error('Failed to fetch prayer times');
    }

    const data: AlAdhanResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
}

export async function fetchPrayerTimesByCoordinates(lat: number, lng: number, method: number = 2, school: number = 0): Promise<AlAdhanResponse | null> {
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`, {
      next: { revalidate: 43200 }, // Cache for 12 hours - prayer times don't change hourly
    });

    if (!res.ok) {
      throw new Error('Failed to fetch prayer times by coordinates');
    }

    const data: AlAdhanResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching prayer times by coordinates:', error);
    return null;
  }
}

// Check if a date was a period cycle day
async function checkIsPeriodDate(userId: mongoose.Types.ObjectId, dateStr: string): Promise<boolean> {
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

async function getPeriodDateSet(userId: mongoose.Types.ObjectId, startDateStr: string, endDateStr: string): Promise<Set<string>> {
  const periodDates = await PeriodTracker.find({
    userId,
    $or: [
      { startDate: { $lte: endDateStr }, endDate: { $gte: startDateStr } },
      { isActive: true, startDate: { $lte: endDateStr } }
    ]
  }).lean();

  const periodDateSet = new Set<string>();
  periodDates.forEach((cycle: any) => {
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate || new Date());
    const current = new Date(cycleStart);

    while (current <= cycleEnd) {
      periodDateSet.add(current.toLocaleDateString('en-CA'));
      current.setDate(current.getDate() + 1);
    }
  });

  return periodDateSet;
}

async function syncPastMissedPrayers(user: any) {
  try {
    const start = new Date(user.createdAt);
    start.setHours(0,0,0,0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    
    if (start > yesterday) return;
    
    const dateStrings: string[] = [];
    const current = new Date(start);
    while (current <= yesterday) {
      dateStrings.push(current.toLocaleDateString('en-CA'));
      current.setDate(current.getDate() + 1);
    }
    
    if (dateStrings.length === 0) return;
    
    const logs = await PrayerLog.find({ userId: user._id, date: { $in: dateStrings } });
    const logsMap = new Map(logs.map(l => [l.date, l]));
    
    // Collect all period dates in one query
    const periodDates = await PeriodTracker.find({
      userId: user._id,
      $or: [
        { startDate: { $lte: dateStrings[dateStrings.length - 1] }, endDate: { $gte: dateStrings[0] } },
        { isActive: true, startDate: { $lte: dateStrings[dateStrings.length - 1] } }
      ]
    }).lean();

    const periodDateSet = new Set<string>();
    periodDates.forEach((cycle: any) => {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = new Date(cycle.endDate || new Date());
      const current = new Date(cycleStart);
      while (current <= cycleEnd) {
        periodDateSet.add(current.toLocaleDateString('en-CA'));
        current.setDate(current.getDate() + 1);
      }
    });

    // Batch operations for MissedPrayer
    const missedPrayerBulkOps: any[] = [];
    const prayerLogBulkOps: any[] = [];

    for (const dateStr of dateStrings) {
      const isPeriodDay = periodDateSet.has(dateStr);
      const log = logsMap.get(dateStr);
      
      if (!log) {
        // Create missed log
        prayerLogBulkOps.push({
          insertOne: {
            document: {
              userId: user._id,
              date: dateStr,
              fajr: isPeriodDay ? 'excused' : 'missed',
              dhuhr: isPeriodDay ? 'excused' : 'missed',
              asr: isPeriodDay ? 'excused' : 'missed',
              maghrib: isPeriodDay ? 'excused' : 'missed',
              isha: isPeriodDay ? 'excused' : 'missed',
              completionPercentage: isPeriodDay ? 100 : 0
            }
          }
        });
        
        if (!isPeriodDay) {
          // Add missed prayer batch operations
          for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
            missedPrayerBulkOps.push({
              updateOne: {
                filter: { userId: user._id, prayerName: p },
                update: { $inc: { count: 1 } },
                upsert: true
              }
            });
          }
        }
      }
    }

    // Execute batch operations
    if (missedPrayerBulkOps.length > 0) {
      await MissedPrayer.bulkWrite(missedPrayerBulkOps);
    }
    if (prayerLogBulkOps.length > 0) {
      await PrayerLog.bulkWrite(prayerLogBulkOps);
    }
  } catch (error) {
    console.error('Error syncing past missed prayers:', error);
  }
}

export async function getTodayPrayerLog(localDateStr: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return null;

    await syncPastMissedPrayers(user);

    const isPeriodDay = await checkIsPeriodDate(user._id as any, localDateStr);

    let log = await PrayerLog.findOne({ userId: user._id, date: localDateStr });
    if (!log) {
      log = new PrayerLog({
        userId: user._id,
        date: localDateStr,
        fajr: isPeriodDay ? 'excused' : 'pending',
        dhuhr: isPeriodDay ? 'excused' : 'pending',
        asr: isPeriodDay ? 'excused' : 'pending',
        maghrib: isPeriodDay ? 'excused' : 'pending',
        isha: isPeriodDay ? 'excused' : 'pending',
        completionPercentage: isPeriodDay ? 100 : 0,
      });
      await log.save();
    } else if (isPeriodDay && (log.fajr !== 'excused' || log.dhuhr !== 'excused')) {
      // Auto-adjust if period is toggled
      log.fajr = 'excused';
      log.dhuhr = 'excused';
      log.asr = 'excused';
      log.maghrib = 'excused';
      log.isha = 'excused';
      log.completionPercentage = 100;
      await log.save();
    }

    return JSON.parse(JSON.stringify(log));
  } catch (error) {
    console.error('Error fetching today\'s prayer log:', error);
    return null;
  }
}

export async function togglePrayerStatus(localDateStr: string, prayerName: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const isPeriodDay = await checkIsPeriodDate(user._id as any, localDateStr);
    const resolvedStatus = isPeriodDay ? 'excused' : status;

    const updateField = prayerName.toLowerCase();
    const log = await PrayerLog.findOne({ userId: user._id, date: localDateStr }).lean();

    const update: any = { [updateField]: resolvedStatus };

    // Recalculate completion percentage
    const currentLog = log || { fajr: 'pending', dhuhr: 'pending', asr: 'pending', maghrib: 'pending', isha: 'pending' };
    const tempLog = {
      fajr: currentLog.fajr,
      dhuhr: currentLog.dhuhr,
      asr: currentLog.asr,
      maghrib: currentLog.maghrib,
      isha: currentLog.isha,
      [updateField]: resolvedStatus
    };

    const prayers = [tempLog.fajr, tempLog.dhuhr, tempLog.asr, tempLog.maghrib, tempLog.isha];
    const completedCount = prayers.filter(p => p === 'completed' || p === 'excused').length;
    update.completionPercentage = Math.round((completedCount / 5) * 100);

    const updatedLog = await PrayerLog.findOneAndUpdate(
      { userId: user._id, date: localDateStr },
      update,
      { upsert: true, new: true }
    );

    return { success: true, log: JSON.parse(JSON.stringify(updatedLog)) };
  } catch (error: any) {
    console.error('Error logging prayer:', error);
    return { success: false, error: error.message };
  }
}

export async function getPrayerStreaks(localTodayStr?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { currentStreak: 0, fajrStreak: 0 };

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return { currentStreak: 0, fajrStreak: 0 };

    // Fetch last 60 days of prayer logs to calculate streak
    const logs = await PrayerLog.find({ userId: user._id }).lean()
      .sort({ date: -1 })
      .limit(60);

    const logsMap = new Map(logs.map(l => [l.date, l]));

    const todayStr = localTodayStr || new Date().toLocaleDateString('en-CA');
    const startDate = new Date(todayStr);
    startDate.setDate(startDate.getDate() - 59);
    startDate.setHours(0, 0, 0, 0);
    const periodDateSet = await getPeriodDateSet(user._id as any, startDate.toLocaleDateString('en-CA'), todayStr);

    let currentStreak = 0;
    let fajrStreak = 0;
    let streakBroken = false;
    let fajrStreakBroken = false;

    const today = new Date(`${todayStr}T00:00:00`);
    
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const log = logsMap.get(dateStr);
      const isPeriod = periodDateSet.has(dateStr);

      if (isPeriod) {
        // Skip period cycle days, they do not break the streak
        continue;
      }

      // If it's today and they haven't completed all prayers yet, don't break the streak
      if (i === 0) {
        if (log) {
          const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
          const allOk = prayers.every(p => p === 'completed' || p === 'excused');
          const fajrOk = log.fajr === 'completed' || log.fajr === 'excused';

          if (allOk) currentStreak++;
          if (fajrOk) fajrStreak++;
        }
        continue;
      }

      // For yesterday and older
      if (!log) {
        // No log and not on period: streak breaks
        streakBroken = true;
        fajrStreakBroken = true;
      } else {
        const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
        const allCompleted = prayers.every(p => p === 'completed' || p === 'excused');
        const fajrCompleted = log.fajr === 'completed' || log.fajr === 'excused';

        if (!streakBroken && allCompleted) {
          currentStreak++;
        } else {
          streakBroken = true;
        }

        if (!fajrStreakBroken && fajrCompleted) {
          fajrStreak++;
        } else {
          fajrStreakBroken = true;
        }
      }

      if (streakBroken && fajrStreakBroken) {
        break;
      }
    }

    return { currentStreak, fajrStreak };
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return { currentStreak: 0, fajrStreak: 0 };
  }
}

export async function getQazaPrayers() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return null;

    await syncPastMissedPrayers(user);

    const qazaDocs = await MissedPrayer.find({ userId: user._id }).lean();
    const result: any = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
    qazaDocs.forEach(doc => {
      result[doc.prayerName] = doc.count;
    });

    return result;
  } catch (error) {
    console.error('Error getting Qaza count:', error);
    return null;
  }
}

export async function updateQazaPrayer(prayerName: string, change: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const key = prayerName.toLowerCase();
    
    // Find or create
    const qazaDoc = await MissedPrayer.findOne({ userId: user._id, prayerName: key } as any);
    if (qazaDoc) {
      qazaDoc.count = Math.max(0, qazaDoc.count + change);
      await qazaDoc.save();
    } else {
      await MissedPrayer.create({
        userId: user._id,
        prayerName: key as any,
        count: Math.max(0, change),
      });
    }

    // Retrieve all updated counts to return to the frontend
    const qazaDocs = await MissedPrayer.find({ userId: user._id }).lean();
    const result: any = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
    qazaDocs.forEach(doc => {
      result[doc.prayerName] = doc.count;
    });

    return { success: true, qaza: result };
  } catch (error: any) {
    console.error('Error updating Qaza prayer:', error);
    return { success: false, error: error.message };
  }
}

import { unstable_cache } from 'next/cache';

const getCachedHeatmapLogs = unstable_cache(
  async (userIdStr: string, sinceDateStr: string) => {
    await connectToDatabase();
    const PrayerLog = (await import('@/models/PrayerLog')).PrayerLog;
    return await PrayerLog.find({
      userId: userIdStr,
      date: { $gte: sinceDateStr }
    }).select('date completionPercentage').lean();
  },
  ['prayer-heatmap-data'],
  { revalidate: 86400 } // Cache for 24 hours
);

export async function getPrayerHeatmapData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return [];

    // Load past 365 days of logs for heatmap
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 365);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    const logs = await getCachedHeatmapLogs(user._id.toString(), sinceDateStr);

    return logs.map(l => ({
      date: l.date,
      count: Math.round(l.completionPercentage / 20), // Convert percentage (0-100) to completed prayer count (0-5)
      completionPercentage: l.completionPercentage
    }));
  } catch (error) {
    console.error('Error getting prayer heatmap:', error);
    return [];
  }
}

export async function getPrayersPageData(localDateStr: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();

    const [user, periodOn, todayLog, streaks, qaza, heatmap] = await Promise.all([
      User.findOne({ email: session.user.email }).lean(),
      isPeriodActive(),
      getTodayPrayerLog(localDateStr),
      getPrayerStreaks(localDateStr),
      getQazaPrayers(),
      getPrayerHeatmapData()
    ]);

    return {
      user: JSON.parse(JSON.stringify(user)),
      isCycleActive: periodOn,
      todayLog,
      streaks,
      qazaPrayers: qaza,
      heatmapData: heatmap
    };
  } catch (error) {
    console.error('Failed to load combined prayers page data:', error);
    return null;
  }
}

// Get monthly prayer logs and historical stats
export async function getMonthlyPrayerHistory(yearInput?: number, monthInput?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return { success: false, error: 'User not found' };

    const now = new Date();
    const targetYear = yearInput !== undefined ? yearInput : now.getFullYear();
    const targetMonth = monthInput !== undefined ? monthInput : now.getMonth(); // 0-indexed

    // Format start and end date strings: YYYY-MM-DD
    const startOfTargetMonth = new Date(targetYear, targetMonth, 1);
    const endOfTargetMonth = new Date(targetYear, targetMonth + 1, 0); // last day

    const startStr = startOfTargetMonth.toISOString().split('T')[0];
    const endStr = endOfTargetMonth.toISOString().split('T')[0];

    // Fetch all logs for target month
    const targetLogs = await PrayerLog.find({
      userId: user._id,
      date: { $gte: startStr, $lte: endStr }
    }).sort({ date: 1 }).lean();

    // Calculate details for each prayer in the target month
    let fajrCompleted = 0, dhuhrCompleted = 0, asrCompleted = 0, maghribCompleted = 0, ishaCompleted = 0;
    let sumPercentage = 0;

    targetLogs.forEach((log: any) => {
      if (log.fajr === 'completed') fajrCompleted++;
      if (log.dhuhr === 'completed') dhuhrCompleted++;
      if (log.asr === 'completed') asrCompleted++;
      if (log.maghrib === 'completed') maghribCompleted++;
      if (log.isha === 'completed') ishaCompleted++;
      sumPercentage += log.completionPercentage || 0;
    });

    const averageCompletion = targetLogs.length > 0 ? Math.round(sumPercentage / targetLogs.length) : 0;

    // Get historical months (last 6 months)
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      
      const sDate = new Date(y, m, 1).toISOString().split('T')[0];
      const eDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
      
      const logs = await PrayerLog.find({
        userId: user._id,
        date: { $gte: sDate, $lte: eDate }
      }).select('completionPercentage').lean();
      
      let sumPct = 0;
      logs.forEach((l: any) => {
        sumPct += l.completionPercentage || 0;
      });
      const avg = logs.length > 0 ? Math.round(sumPct / logs.length) : 0;
      
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      history.push({
        month: monthName,
        year: y,
        percentage: avg,
        daysLogged: logs.length
      });
    }

    return {
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        logs: JSON.parse(JSON.stringify(targetLogs)),
        stats: {
          totalDays: endOfTargetMonth.getDate(),
          daysLogged: targetLogs.length,
          averageCompletion,
          prayers: {
            fajr: { completed: fajrCompleted },
            dhuhr: { completed: dhuhrCompleted },
            asr: { completed: asrCompleted },
            maghrib: { completed: maghribCompleted },
            isha: { completed: ishaCompleted }
          }
        },
        history
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



