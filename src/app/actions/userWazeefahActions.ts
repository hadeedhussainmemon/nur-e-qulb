'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Wazeefah } from '@/models/Wazeefah';
import { UserWazeefah } from '@/models/UserWazeefah';
import { revalidatePath } from 'next/cache';

export async function getUserWazeefahs() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return [];

    const wazeefahs = await UserWazeefah.find({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(wazeefahs));
  } catch (error) {
    console.error('Failed to get user wazeefahs:', error);
    return [];
  }
}

export async function subscribeToWazeefah(wazeefahId: string, targetCount: number, reminderTime: string, reminderDays?: number[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const template = await Wazeefah.findById(wazeefahId);
    if (!template) throw new Error('Community Wazeefah not found');

    // Check if already subscribed
    const existing = await UserWazeefah.findOne({
      userId: user._id,
      wazeefahId: template._id,
      isActive: true,
    });

    if (existing) {
      throw new Error('You have already added this Wazeefah to your schedule.');
    }

    const newUserWazeefah = await UserWazeefah.create({
      userId: user._id,
      wazeefahId: template._id,
      title: template.title,
      description: template.description,
      instructions: template.instructions,
      reference: template.reference,
      reminderDays: reminderDays || template.reminderDays || [0, 1, 2, 3, 4, 5, 6],
      targetCount: targetCount || 33,
      reminderTime: reminderTime || 'Fajr',
      isCustom: false,
      isActive: true,
      completions: [],
    });

    revalidatePath('/wazeefahs');
    revalidatePath('/');

    return { success: true, userWazeefah: JSON.parse(JSON.stringify(newUserWazeefah)) };
  } catch (error: any) {
    console.error('Error subscribing to wazeefah:', error);
    return { success: false, error: error.message };
  }
}

export async function createCustomWazeefah(
  title: string,
  description: string,
  instructions: string[],
  targetCount: number,
  reminderTime: string,
  quranRef?: { surahNumber: number; surahName: string; fromAyah?: number; toAyah?: number } | null,
  reference?: string | null,
  reminderDays: number[] = [0, 1, 2, 3, 4, 5, 6]
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const newUserWazeefah = await UserWazeefah.create({
      userId: user._id,
      title,
      description,
      instructions: instructions || [],
      quranRef: quranRef || undefined,
      targetCount: targetCount || 33,
      reminderTime: reminderTime || 'Fajr',
      isCustom: true,
      isActive: true,
      completions: [],
      reference: reference || undefined,
      reminderDays: reminderDays,
    });

    revalidatePath('/wazeefahs');
    revalidatePath('/');

    return { success: true, userWazeefah: JSON.parse(JSON.stringify(newUserWazeefah)) };
  } catch (error: any) {
    console.error('Error creating custom wazeefah:', error);
    return { success: false, error: error.message };
  }
}

export async function logWazeefahProgress(userWazeefahId: string, count: number, dateString: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const userWazeefah = await UserWazeefah.findOne({ _id: userWazeefahId, userId: user._id });
    if (!userWazeefah) throw new Error('Scheduled wazeefah not found');

    const completionIndex = userWazeefah.completions.findIndex((c) => c.date === dateString);
    if (completionIndex > -1) {
      userWazeefah.completions[completionIndex].count = count;
    } else {
      userWazeefah.completions.push({ date: dateString, count });
    }

    await userWazeefah.save();

    revalidatePath('/wazeefahs');
    revalidatePath('/');

    return { success: true, userWazeefah: JSON.parse(JSON.stringify(userWazeefah)) };
  } catch (error: any) {
    console.error('Error logging wazeefah progress:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUserWazeefah(userWazeefahId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    await UserWazeefah.findOneAndDelete({ _id: userWazeefahId, userId: user._id });

    revalidatePath('/wazeefahs');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user wazeefah:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserWazeefah(
  userWazeefahId: string,
  updates: {
    title?: string;
    description?: string;
    instructions?: string[];
    targetCount?: number;
    reminderTime?: string;
    reminderDays?: number[];
    reference?: string | null;
    quranRef?: { surahNumber: number; surahName: string; fromAyah?: number; toAyah?: number } | null;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const updated = await UserWazeefah.findOneAndUpdate(
      { _id: userWazeefahId, userId: user._id },
      updates,
      { new: true }
    );

    if (!updated) throw new Error('Wazeefah not found');

    revalidatePath('/wazeefahs');
    revalidatePath('/');

    return { success: true, userWazeefah: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('Error updating user wazeefah:', error);
    return { success: false, error: error.message };
  }
}
