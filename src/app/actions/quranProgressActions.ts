'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { QuranProgress } from '@/models/QuranProgress';
import { revalidatePath } from 'next/cache';

export async function getQuranProgress() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return null;

    let progress = await QuranProgress.findOne({ userId: user._id }).lean();
    if (!progress) {
      // Initialize progress for all 30 Juz
      const juzProgress = Array.from({ length: 30 }, (_, i) => ({
        juzNumber: i + 1,
        completed: false,
      }));

      progress = await QuranProgress.create({
        userId: user._id,
        juzProgress,
        khatmCount: 0,
        overallPercentage: 0,
      });
    }

    return JSON.parse(JSON.stringify(progress));
  } catch (error) {
    console.error('Error getting Quran progress:', error);
    return null;
  }
}

export async function toggleJuzCompleted(juzNumber: number, completed: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    let progress = await QuranProgress.findOne({ userId: user._id });
    if (!progress) {
      const juzProgress = Array.from({ length: 30 }, (_, i) => ({
        juzNumber: i + 1,
        completed: false,
      }));
      progress = new QuranProgress({
        userId: user._id,
        juzProgress,
        khatmCount: 0,
        overallPercentage: 0,
      });
    }

    // Find the juz and update its status
    const juzItem = progress.juzProgress.find((j: any) => j.juzNumber === juzNumber);
    if (juzItem) {
      juzItem.completed = completed;
    } else {
      progress.juzProgress.push({ juzNumber, completed });
    }

    // Recalculate overall percentage
    const completedCount = progress.juzProgress.filter((j) => j.completed).length;
    progress.overallPercentage = Math.round((completedCount / 30) * 100);

    await progress.save();
    
    revalidatePath('/quran');
    revalidatePath('/');

    return { success: true, progress: JSON.parse(JSON.stringify(progress)) };
  } catch (error: any) {
    console.error('Error toggling Juz completion:', error);
    return { success: false, error: error.message };
  }
}

export async function incrementKhatmCount() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    let progress = await QuranProgress.findOne({ userId: user._id });
    if (!progress) {
      const juzProgress = Array.from({ length: 30 }, (_, i) => ({
        juzNumber: i + 1,
        completed: false,
      }));
      progress = new QuranProgress({
        userId: user._id,
        juzProgress,
        khatmCount: 0,
        overallPercentage: 0,
      });
    }

    // Increment Khatm and reset Juz progress for the next Khatm
    progress.khatmCount += 1;
    progress.overallPercentage = 0;
    progress.juzProgress.forEach((j) => {
      j.completed = false;
    });
    progress.targetDate = undefined;
    progress.startDate = undefined;

    await progress.save();

    revalidatePath('/quran');
    revalidatePath('/');

    return { success: true, progress: JSON.parse(JSON.stringify(progress)) };
  } catch (error: any) {
    console.error('Error incrementing Khatm count:', error);
    return { success: false, error: error.message };
  }
}

export async function setKhatmTarget(targetDateStr: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    let progress = await QuranProgress.findOne({ userId: user._id });
    if (!progress) {
      const juzProgress = Array.from({ length: 30 }, (_, i) => ({
        juzNumber: i + 1,
        completed: false,
      }));
      progress = new QuranProgress({
        userId: user._id,
        juzProgress,
        khatmCount: 0,
        overallPercentage: 0,
      });
    }

    if (targetDateStr) {
      progress.targetDate = new Date(targetDateStr);
      progress.startDate = new Date();
    } else {
      progress.targetDate = undefined;
      progress.startDate = undefined;
    }

    await progress.save();

    revalidatePath('/quran');
    revalidatePath('/');

    return { success: true, progress: JSON.parse(JSON.stringify(progress)) };
  } catch (error: any) {
    console.error('Error setting Khatm target:', error);
    return { success: false, error: error.message };
  }
}
