'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { FamilyChallenge } from '@/models/FamilyChallenge';
import { revalidatePath } from 'next/cache';

export async function getFamilyChallenges() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.familyId) return [];

    const challenges = await FamilyChallenge.find({ familyId: user.familyId })
      .populate('progress.userId', 'name')
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(challenges));
  } catch (error) {
    console.error('Error fetching family challenges:', error);
    return [];
  }
}

export async function createFamilyChallenge(
  title: string,
  description: string,
  type: 'quran' | 'dhikr' | 'fasting' | 'prayers',
  target: number,
  endDateStr: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    if (!user.familyId) throw new Error('You must belong to a Family Group to create a challenge');

    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) throw new Error('Invalid end date');

    const challenge = await FamilyChallenge.create({
      familyId: user.familyId,
      title,
      description,
      type,
      target,
      endDate,
      progress: [],
      isCompleted: false
    });

    revalidatePath('/family');
    return { success: true, challenge: JSON.parse(JSON.stringify(challenge)) };
  } catch (error: any) {
    console.error('Error creating family challenge:', error);
    return { success: false, error: error.message };
  }
}

export async function contributeToChallenge(challengeId: string, count: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    if (!user.familyId) throw new Error('User is not part of a family');

    if (count <= 0) throw new Error('Contribution count must be positive');

    // 1. Try to increment progress for the existing user entry in this challenge
    let challenge = await FamilyChallenge.findOneAndUpdate(
      { _id: challengeId, familyId: user.familyId, 'progress.userId': user._id },
      { $inc: { 'progress.$.count': count } },
      { new: true }
    );

    // 2. If user wasn't in the progress list yet, push their entry
    if (!challenge) {
      challenge = await FamilyChallenge.findOneAndUpdate(
        { _id: challengeId, familyId: user.familyId },
        { $push: { progress: { userId: user._id, count } } },
        { new: true }
      );
    }

    if (!challenge) throw new Error('Challenge not found or does not belong to your family');

    // 3. Check and update completion status
    const totalProgress = challenge.progress.reduce((sum, p) => sum + p.count, 0);
    if (totalProgress >= challenge.target && !challenge.isCompleted) {
      challenge.isCompleted = true;
      await challenge.save();
    }

    revalidatePath('/family');
    return { success: true, challenge: JSON.parse(JSON.stringify(challenge)) };
  } catch (error: any) {
    console.error('Error contributing to challenge:', error);
    return { success: false, error: error.message };
  }
}
