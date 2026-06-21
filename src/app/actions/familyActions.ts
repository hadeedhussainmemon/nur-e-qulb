'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { FamilyGroup } from '@/models/FamilyGroup';
import { revalidatePath } from 'next/cache';
import { PrayerLog } from '@/models/PrayerLog';
import mongoose from 'mongoose';

// Helper to generate a unique 6-character alphanumeric code
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getFamilyDetails() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user || !user.familyId) return null;

    const group = await FamilyGroup.findById(user.familyId).populate('members', 'name email role');
    if (!group) return null;

    const localTodayDateString = new Date().toLocaleDateString('en-CA');
    const enrichedMembers = await Promise.all(group.members.map(async (member: any) => {
      // 1. Get today's prayer completion
      const log = await PrayerLog.findOne({ userId: member._id, date: localTodayDateString }).lean();
      let todayCompletion = 0;
      if (log) {
        const prayers = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha];
        const done = prayers.filter(p => p === 'completed' || p === 'excused').length;
        todayCompletion = Math.round((done / 5) * 100);
      }

      // 2. Fetch last 7 days of logs to get a weekly completion count
      const lastWeekLogs = await PrayerLog.find({
        userId: member._id,
        date: { $lte: localTodayDateString }
      }).sort({ date: -1 }).limit(7).lean();
      
      let weekCompleted = 0;
      lastWeekLogs.forEach((wl: any) => {
        const prayers = [wl.fajr, wl.dhuhr, wl.asr, wl.maghrib, wl.isha];
        weekCompleted += prayers.filter(p => p === 'completed').length;
      });

      return {
        ...JSON.parse(JSON.stringify(member)),
        analytics: {
          todayCompletion,
          weekCompleted,
        }
      };
    }));

    const result = JSON.parse(JSON.stringify(group));
    result.members = enrichedMembers;
    return result;
  } catch (error) {
    console.error('Error fetching family details:', error);
    return null;
  }
}

export async function createFamilyGroup(name: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    if (user.familyId) throw new Error('You are already in a Family Group');

    // Generate unique code
    let joinCode = generateJoinCode();
    let codeExists = await FamilyGroup.findOne({ joinCode }).lean();
    while (codeExists) {
      joinCode = generateJoinCode();
      codeExists = await FamilyGroup.findOne({ joinCode }).lean();
    }

    const group = await FamilyGroup.create({
      name,
      joinCode,
      adminId: user._id,
      members: [user._id]
    });

    user.familyId = group._id as any;
    await user.save();

    revalidatePath('/family');
    return { success: true, group: JSON.parse(JSON.stringify(group)) };
  } catch (error: any) {
    console.error('Error creating family group:', error);
    return { success: false, error: error.message };
  }
}

export async function joinFamilyGroup(joinCode: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length !== 6) throw new Error('Join code must be exactly 6 characters');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    if (user.familyId) throw new Error('You are already in a Family Group');

    const group = await FamilyGroup.findOne({ joinCode: cleanCode });
    if (!group) throw new Error('Family group not found with this code');

    // Add user if not already in members
    if (!group.members.includes(user._id as any)) {
      group.members.push(user._id as any);
      await group.save();
    }

    user.familyId = group._id as any;
    await user.save();

    revalidatePath('/family');
    return { success: true, group: JSON.parse(JSON.stringify(group)) };
  } catch (error: any) {
    console.error('Error joining family group:', error);
    return { success: false, error: error.message };
  }
}

export async function leaveFamilyGroup() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.familyId) throw new Error('You are not in a family group');

    const group = await FamilyGroup.findById(user.familyId);
    if (group) {
      // Remove member
      group.members = group.members.filter(m => m.toString() !== user._id.toString());
      
      // If admin is leaving and there are other members, assign a new admin. Otherwise delete group.
      if (group.adminId.toString() === user._id.toString()) {
        if (group.members.length > 0) {
          group.adminId = group.members[0];
          await group.save();
        } else {
          await FamilyGroup.findByIdAndDelete(group._id);
        }
      } else {
        await group.save();
      }
    }

    user.familyId = undefined;
    await user.save();

    revalidatePath('/family');
    return { success: true };
  } catch (error: any) {
    console.error('Error leaving family group:', error);
    return { success: false, error: error.message };
  }
}
