'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).populate('settingsId').lean().lean();
    if (!user) return null;

    // Convert mongoose document to plain JS object for RSC compatibility
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function updateUserSettings(data: {
  madhab?: string;
  prayerCalculationMethod?: string;
  theme?: string;
  notifications?: {
    prayerReminders: boolean;
    dailyAyah: boolean;
    dailyHadith: boolean;
    fridayReminders: boolean;
    ramadanReminders: boolean;
  };
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    let settings = await Settings.findOne({ userId: user._id }).lean();
    if (!settings) {
      settings = new Settings({ userId: user._id });
    }

    if (data.madhab !== undefined) settings.madhab = data.madhab;
    if (data.prayerCalculationMethod !== undefined) settings.prayerCalculationMethod = data.prayerCalculationMethod;
    if (data.theme !== undefined) settings.theme = data.theme;
    if (data.notifications !== undefined) {
      settings.notifications = {
        ...settings.notifications,
        ...data.notifications,
      };
    }

    await settings.save();

    // If settingsId was not set on user, set it
    if (!user.settingsId) {
      user.settingsId = settings._id as any;
      await user.save();
    }

    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserGender(gender: 'male' | 'female' | 'other') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { gender },
      { new: true }
    ).lean();

    return { success: true, gender: user?.gender };
  } catch (error: any) {
    console.error('Error updating user gender:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserLocation(city: string, country: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { location: { city, country, latitude: 0, longitude: 0 } },
      { new: true }
    ).lean();

    return { success: true, location: JSON.parse(JSON.stringify(user?.location)) };
  } catch (error: any) {
    console.error('Error updating location:', error);
    return { success: false, error: error.message };
  }
}
