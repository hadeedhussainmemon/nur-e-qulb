'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { FastingLog } from '@/models/FastingLog';
import { RamadanStats } from '@/models/RamadanStats';
import { MissedFast } from '@/models/MissedFast';

function getHijriYear(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', { year: 'numeric' });
    const formatted = formatter.format(new Date()); // e.g. "1447 AH"
    const match = formatted.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1447;
  } catch (e) {
    return 1447; // fallback
  }
}


export async function getFastingLogs() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return [];

    const logs = await FastingLog.find({ userId: user._id }).sort({ date: -1 }).limit(30).lean();
    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    console.error('Error fetching fasting logs:', error);
    return [];
  }
}

export async function logFast(dateStr: string, type: string, status: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const date = new Date(dateStr);

    const log = await FastingLog.findOneAndUpdate(
      { userId: user._id, date },
      { type, status, notes },
      { upsert: true, new: true }
    );

    // If a makeup fast was completed, we can decrement the missed fasts in RamadanStats for the current Hijri year
    if (type === 'makeup' && status === 'completed') {
      const currentYear = getHijriYear();
      await RamadanStats.findOneAndUpdate(
        { userId: user._id, year: currentYear },
        { $inc: { fastsMissed: -1 } },
        { upsert: true }
      );
    }

    return { success: true, log: JSON.parse(JSON.stringify(log)) };
  } catch (error: any) {
    console.error('Error logging fast:', error);
    return { success: false, error: error.message };
  }
}

export async function getFastingSummary() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { totalFasts: 0, sunnahFasts: 0, makeupsRemaining: 0 };

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return { totalFasts: 0, sunnahFasts: 0, makeupsRemaining: 0 };

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Total completed fasts this year
    const totalFasts = await FastingLog.countDocuments({
      userId: user._id,
      status: 'completed',
      date: { $gte: startOfYear }
    } as any);

    // Sunnah completed fasts this year
    const sunnahTypes = ['sunnah_monday', 'sunnah_thursday', 'white_days', 'ashura', 'arafah'];
    const sunnahFasts = await FastingLog.countDocuments({
      userId: user._id,
      status: 'completed',
      type: { $in: sunnahTypes },
      date: { $gte: startOfYear }
    } as any);

    // Missed fasts (makeup targets) from RamadanStats
    const ramadanYear = getHijriYear();
    const ramadanStats = await RamadanStats.findOne({ userId: user._id, year: ramadanYear }).lean();
    const missedFasts = ramadanStats ? ramadanStats.fastsMissed : 0;

    return {
      totalFasts,
      sunnahFasts,
      makeupsRemaining: Math.max(0, missedFasts),
    };
  } catch (error) {
    console.error('Error fetching fasting summary:', error);
    return { totalFasts: 0, sunnahFasts: 0, makeupsRemaining: 0 };
  }
}

export async function adjustFastsMissed(change: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const currentYear = getHijriYear();
    const stats = await RamadanStats.findOneAndUpdate(
      { userId: user._id, year: currentYear },
      { $inc: { fastsMissed: change } },
      { upsert: true, new: true }
    );

    // Ensure it doesn't fall below 0
    if (stats.fastsMissed < 0) {
      stats.fastsMissed = 0;
      await stats.save();
    }

    return { success: true, missedFasts: stats.fastsMissed };
  } catch (error: any) {
    console.error('Error adjusting missed fasts:', error);
    return { success: false, error: error.message };
  }
}

export async function getLifetimeQazaFasts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return 0;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return 0;

    const missed = await MissedFast.findOne({ userId: user._id }).lean();
    return missed ? missed.count : 0;
  } catch (error) {
    console.error('Error fetching lifetime qaza fasts:', error);
    return 0;
  }
}

export async function updateLifetimeQazaFasts(change: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const missed = await MissedFast.findOneAndUpdate(
      { userId: user._id },
      { $inc: { count: change } },
      { upsert: true, new: true }
    );

    if (missed.count < 0) {
      missed.count = 0;
      await missed.save();
    }

    return { success: true, count: missed.count };
  } catch (error: any) {
    console.error('Error updating lifetime qaza fasts:', error);
    return { success: false, error: error.message };
  }
}
