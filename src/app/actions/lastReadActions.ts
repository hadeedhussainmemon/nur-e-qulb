'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { LastRead } from '@/models/LastRead';

export async function saveLastRead(surahNumber: number, ayahNumber: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const lastRead = await LastRead.findOneAndUpdate(
      { userId: user._id },
      { surahNumber, ayahNumber },
      { upsert: true, new: true }
    );

    return { success: true, lastRead: JSON.parse(JSON.stringify(lastRead)) };
  } catch (error: any) {
    console.error('Error saving last read progress:', error);
    return { success: false, error: error.message };
  }
}

export async function getLastRead() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return null;

    const progress = await LastRead.findOne({ userId: user._id });
    if (!progress) return null;

    return JSON.parse(JSON.stringify(progress));
  } catch (error) {
    console.error('Error getting last read progress:', error);
    return null;
  }
}
