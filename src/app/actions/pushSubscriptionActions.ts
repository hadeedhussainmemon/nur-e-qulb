'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { PushSubscription } from '@/models/PushSubscription';
import { User } from '@/models/User';

export async function savePushSubscription(subscription: any) {
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

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { userId: user._id, 'subscription.endpoint': subscription.endpoint },
      {
        userId: user._id,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
      },
      { upsert: true, new: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Failed to save push subscription:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePushSubscription(endpoint: string) {
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

    await PushSubscription.deleteOne({
      userId: user._id,
      'subscription.endpoint': endpoint,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete push subscription:', error);
    return { success: false, error: error.message };
  }
}
