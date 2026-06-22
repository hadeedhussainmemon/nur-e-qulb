'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { getPrayerStreaks, getTodayPrayerLog } from '@/app/actions/prayerActions';
import { getLastRead } from '@/app/actions/lastReadActions';
import { getFastingSummary } from '@/app/actions/fastingActions';
import { getQuranBookmarks } from '@/app/actions/bookmarkActions';
import { getQuranProgress } from '@/app/actions/quranProgressActions';
import { getUserWazeefahs } from '@/app/actions/userWazeefahActions';
import { getFamilyDetails } from '@/app/actions/familyActions';
import { getApprovedWazeefahs } from '@/app/actions/wazeefahActions';
import { z } from 'zod';

const settingsSchema = z.object({
  theme: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().min(12).max(32).optional(),
  language: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  notifications: z.object({
    prayerReminders: z.boolean().optional(),
    dailyAyah: z.boolean().optional(),
    dailyHadith: z.boolean().optional(),
    fridayReminders: z.boolean().optional(),
    ramadanReminders: z.boolean().optional(),
  }).optional(),
  prayerCalculationMethod: z.string().optional(),
  madhab: z.string().optional(),
  quranTranslation: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  gender: z.enum(['male', 'female', 'other']),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  hijriAdjustment: z.number().min(-5).max(5).default(0),
});

const locationSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
});

const genderSchema = z.enum(['male', 'female', 'other']);

export async function getDashboardData(localTodayDateString: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();

    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      User.findOne({ email: session.user.email }).populate('settingsId').lean(),
      getPrayerStreaks(localTodayDateString),
      getTodayPrayerLog(localTodayDateString),
      getLastRead(),
      getFastingSummary(),
      getQuranBookmarks(),
      getQuranProgress(),
      getUserWazeefahs(),
      getFamilyDetails(),
      getApprovedWazeefahs(),
    ]);

    // Extract values with fallbacks for failures
    const user = results[0].status === 'fulfilled' ? results[0].value : null;
    if (!user) return null;

    return {
      user: JSON.parse(JSON.stringify(user)),
      streaks: results[1].status === 'fulfilled' ? results[1].value : { current: 0, highest: 0, history: {} },
      todayLog: results[2].status === 'fulfilled' ? results[2].value : null,
      lastRead: results[3].status === 'fulfilled' ? results[3].value : null,
      fasting: results[4].status === 'fulfilled' ? results[4].value : null,
      bookmarks: results[5].status === 'fulfilled' ? results[5].value : [],
      quranProgress: results[6].status === 'fulfilled' ? results[6].value : null,
      wazeefahs: results[7].status === 'fulfilled' ? results[7].value : [],
      family: results[8].status === 'fulfilled' ? results[8].value : null,
      approvedWazeefahs: results[9].status === 'fulfilled' ? results[9].value : [],
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).populate('settingsId').lean();
    if (!user) return null;

    // Convert mongoose document to plain JS object for RSC compatibility
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}


export async function updateUserSettings(data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const parseResult = settingsSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(`Validation Error: ${parseResult.error.message}`);
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    let settings = await Settings.findOne({ userId: user._id });
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

export async function updateUserGender(genderInput: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const parseResult = genderSchema.safeParse(genderInput);
    if (!parseResult.success) throw new Error('Invalid gender');
    const gender = parseResult.data;

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

export async function updateUserLocation(cityInput: string, countryInput: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const parseResult = locationSchema.safeParse({ city: cityInput, country: countryInput });
    if (!parseResult.success) throw new Error(`Validation Error: ${parseResult.error.message}`);
    const { city, country } = parseResult.data;

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { 'location.city': city, 'location.country': country },
      { new: true }
    ).lean();

    return { success: true, location: JSON.parse(JSON.stringify(user?.location)) };
  } catch (error: any) {
    console.error('Error updating location:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(nameInput: string, genderInput: string, cityInput: string, countryInput: string, hijriAdjustmentInput: number = 0) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const parseResult = profileSchema.safeParse({ 
      name: nameInput, 
      gender: genderInput, 
      city: cityInput, 
      country: countryInput, 
      hijriAdjustment: hijriAdjustmentInput 
    });
    
    if (!parseResult.success) throw new Error(`Validation Error: ${parseResult.error.message}`);
    const { name, gender, city, country, hijriAdjustment } = parseResult.data;

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { name, gender, 'location.city': city, 'location.country': country, hijriAdjustment },
      { new: true }
    ).lean();

    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
}
