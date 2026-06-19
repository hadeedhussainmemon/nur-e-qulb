'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { PeriodTracker } from '@/models/PeriodTracker';
import { PrayerLog } from '@/models/PrayerLog';

export async function isPeriodActive() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return false;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return false;

    const activePeriod = await PeriodTracker.findOne({ userId: user._id, isActive: true });
    return !!activePeriod;
  } catch (error) {
    console.error('Error checking active period:', error);
    return false;
  }
}

export async function togglePeriodState(isActive: boolean, localDateStr: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    if (isActive) {
      // Start a new cycle if one isn't already active
      const activePeriod = await PeriodTracker.findOne({ userId: user._id, isActive: true });
      if (!activePeriod) {
        await PeriodTracker.create({
          userId: user._id,
          startDate: localDateStr,
          isActive: true,
        });

        // Set today's prayers to excused in PrayerLog
        await PrayerLog.findOneAndUpdate(
          { userId: user._id, date: localDateStr },
          {
            fajr: 'excused',
            dhuhr: 'excused',
            asr: 'excused',
            maghrib: 'excused',
            isha: 'excused',
            completionPercentage: 100, // Excused counts as completed/fulfilled for tracking progress
          },
          { upsert: true, new: true }
        );
      }
    } else {
      // Close the active cycle
      const activePeriod = await PeriodTracker.findOne({ userId: user._id, isActive: true });
      if (activePeriod) {
        activePeriod.isActive = false;
        activePeriod.endDate = localDateStr;
        await activePeriod.save();
      }
    }

    return { success: true, isPeriodActive: isActive };
  } catch (error: any) {
    console.error('Error toggling period state:', error);
    return { success: false, error: error.message };
  }
}

export async function getPeriodHistory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const history = await PeriodTracker.find({ userId: user._id }).sort({ startDate: -1 });
    return JSON.parse(JSON.stringify(history));
  } catch (error) {
    console.error('Error fetching period history:', error);
    return [];
  }
}
