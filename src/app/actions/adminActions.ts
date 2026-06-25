'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { FamilyGroup } from '@/models/FamilyGroup';
import { UserWazeefah } from '@/models/UserWazeefah';
import { Wazeefah } from '@/models/Wazeefah';
import { Notification } from '@/models/Notification';
import { TasbihPreset } from '@/models/TasbihPreset';
import { PrayerLog } from '@/models/PrayerLog';
import { FastingLog } from '@/models/FastingLog';
import { QuranBookmark } from '@/models/QuranBookmark';
import { revalidatePath } from 'next/cache';

// Helper to assert admin privilege
async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

// 1. Get All Users
export async function getAllUsers() {
  try {
    await assertAdmin();
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(users)) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// 2. Toggle User Role
export async function toggleUserRole(userId: string, newRole: 'user' | 'admin') {
  try {
    await assertAdmin();
    await connectToDatabase();
    await User.findByIdAndUpdate(userId, { role: newRole });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Get All Family groups
export async function getAllFamilies() {
  try {
    await assertAdmin();
    await connectToDatabase();
    const families = await FamilyGroup.find({})
      .populate('adminId', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(families)) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// 4. Get Custom User Wazeefas
export async function getCustomUserWazeefas() {
  try {
    await assertAdmin();
    await connectToDatabase();
    const userWazeefahs = await UserWazeefah.find({ isCustom: true })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(userWazeefahs)) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// 5. Promote Custom Wazeefah to Community Preset
export async function promoteWazeefahToPreset(
  userWazeefahId: string,
  category: 'Rizq' | 'Protection' | 'Illness' | 'Anxiety' | 'Exams' | 'Marriage' | 'Forgiveness' | 'Parents' | 'Children' = 'Protection'
) {
  try {
    await assertAdmin();
    await connectToDatabase();

    const userWazeefah = await UserWazeefah.findById(userWazeefahId);
    if (!userWazeefah) throw new Error('Personal Wazeefah not found');

    const wazeefah = await Wazeefah.create({
      title: userWazeefah.title,
      description: userWazeefah.description || 'Community preset promoted from custom user adhkar.',
      category,
      instructions: userWazeefah.instructions || [],
      submittedBy: userWazeefah.userId,
      isApproved: true,
      authenticityScore: 100, // Promoted wazeefahs default to 100% authenticity
      targetCount: userWazeefah.targetCount,
      quranRef: userWazeefah.quranRef,
      reminderTime: userWazeefah.reminderTime,
    });

    revalidatePath('/wazeefahs');
    revalidatePath('/admin');
    return { success: true, wazeefah: JSON.parse(JSON.stringify(wazeefah)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Send Announcements / Greetings
export async function sendAnnouncement(title: string, message: string, targetUserId?: string) {
  try {
    await assertAdmin();
    await connectToDatabase();

    if (targetUserId) {
      await Notification.create({
        userId: targetUserId,
        title,
        message,
        type: 'system',
        isRead: false,
      });
    } else {
      const users = await User.find({}).select('_id').lean();
      const notifications = users.map((u: any) => ({
        userId: u._id,
        title,
        message,
        type: 'system',
        isRead: false,
      }));
      await Notification.insertMany(notifications);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Get Tasbih Presets (loads defaults if empty)
export async function getTasbihPresets() {
  try {
    await connectToDatabase();
    const presets = await TasbihPreset.find({}).sort({ createdAt: 1 }).lean();
    if (presets.length === 0) {
      const defaultPresets = [
        { id: 'subhanallah', text: 'Subhanallah', arabic: 'سُبْحَانَ ٱللَّٰهِ', target: 33 },
        { id: 'alhamdulillah', text: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
        { id: 'allahuakbar', text: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', target: 34 },
        { id: 'astaghfirullah', text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
      ];
      await TasbihPreset.insertMany(defaultPresets);
      return JSON.parse(JSON.stringify(defaultPresets));
    }
    return JSON.parse(JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to get tasbih presets:', error);
    return [];
  }
}

// 8. Save Tasbih Preset (Create/Update)
export async function saveTasbihPreset(id: string, text: string, arabic: string, target: number) {
  try {
    await assertAdmin();
    await connectToDatabase();

    await TasbihPreset.findOneAndUpdate(
      { id },
      { text, arabic, target },
      { upsert: true, new: true }
    );

    revalidatePath('/tasbih');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Delete Tasbih Preset
export async function deleteTasbihPreset(id: string) {
  try {
    await assertAdmin();
    await connectToDatabase();

    await TasbihPreset.deleteOne({ id });
    revalidatePath('/tasbih');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. Get Platform Aggregate Stats
export async function getPlatformStats() {
  try {
    await assertAdmin();
    await connectToDatabase();

    const totalUsers = await User.countDocuments();
    const totalFamilies = await FamilyGroup.countDocuments();
    const totalWazeefahs = await Wazeefah.countDocuments();
    const totalCustomWazeefas = await UserWazeefah.countDocuments({ isCustom: true });

    // Average prayer completion percentage
    const prayerLogs = await PrayerLog.find({}).lean();
    let totalPct = 0;
    prayerLogs.forEach((log: any) => {
      totalPct += log.completionPercentage || 0;
    });
    const avgPrayerCompletion = prayerLogs.length > 0 ? Math.round(totalPct / prayerLogs.length) : 0;

    // Feature popularity metrics
    const totalFastingLogs = await FastingLog.countDocuments();
    const totalQuranBookmarks = await QuranBookmark.countDocuments();
    const totalUserWazeefas = await UserWazeefah.countDocuments();

    // Aggregation of Hijri adjustments by city
    const cityAdjustments = await User.aggregate([
      { $match: { 'location.city': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: {
            city: '$location.city',
            country: '$location.country',
            adjustment: '$hijriAdjustment'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          country: '$_id.country',
          adjustment: { $ifNull: ['$_id.adjustment', 0] },
          count: '$count'
        }
      },
      { $sort: { city: 1, adjustment: 1 } }
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        totalFamilies,
        totalWazeefahs,
        totalCustomWazeefas,
        avgPrayerCompletion,
        featureUsage: {
          prayers: prayerLogs.length,
          fasting: totalFastingLogs,
          quran: totalQuranBookmarks,
          wazeefahs: totalUserWazeefas,
        },
        cityAdjustments,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 11. Update Hijri Adjustment for All Users in a City
export async function updateCityHijriAdjustment(city: string, country: string, adjustment: number) {
  try {
    await assertAdmin();
    await connectToDatabase();

    const query: any = {
      'location.city': { $regex: new RegExp(`^${city.trim()}$`, 'i') }
    };
    if (country) {
      query['location.country'] = { $regex: new RegExp(`^${country.trim()}$`, 'i') };
    }

    const result = await User.updateMany(query, { hijriAdjustment: adjustment });

    revalidatePath('/admin');
    revalidatePath('/calendar');
    revalidatePath('/');

    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

