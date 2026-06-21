'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

export async function completeOnboarding() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { success: false };

    await connectToDatabase();
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { onboardingCompleted: true } }
    );

    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false };
  }
}
