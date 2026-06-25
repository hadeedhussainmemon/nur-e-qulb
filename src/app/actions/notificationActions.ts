'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { revalidatePath } from 'next/cache';

export async function getUserNotifications() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: [] };
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return { success: false, error: 'User not found', data: [] };
    }

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(notifications)) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsRead() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    await Notification.updateMany({ userId: user._id, isRead: false }, { isRead: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
