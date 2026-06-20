'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { Wazeefah } from '@/models/Wazeefah';
import { revalidatePath } from 'next/cache';

export async function getApprovedWazeefahs(category?: string) {
  try {
    await connectToDatabase();
    const query: any = { isApproved: true };
    if (category) {
      query.category = category;
    }
    const wazeefahs = await Wazeefah.find(query).populate('submittedBy', 'name').sort({ createdAt: -1 }).lean().lean();
    return JSON.parse(JSON.stringify(wazeefahs));
  } catch (error) {
    console.error('Failed to get wazeefahs:', error);
    return [];
  }
}

export async function getPendingWazeefahs() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    await connectToDatabase();
    const wazeefahs = await Wazeefah.find({ isApproved: false }).populate('submittedBy', 'name').sort({ createdAt: 1 }).lean().lean();
    return JSON.parse(JSON.stringify(wazeefahs));
  } catch (error) {
    console.error('Failed to get pending wazeefahs:', error);
    return [];
  }
}

export async function submitWazeefah(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Must be logged in to submit a Wazeefah');
    }

    await connectToDatabase();
    // Assuming session user has an ID we stored, or we look it up by email
    const mongoose = (await import('mongoose')).default;
    const User = mongoose.models.User;
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) throw new Error('User not found');

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    
    // Parse instructions (assuming they are newline separated in the textarea)
    const rawInstructions = formData.get('instructions') as string;
    const instructions = rawInstructions.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    await Wazeefah.create({
      title,
      description,
      category: category as any,
      instructions,
      submittedBy: user._id,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Submission failed:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWazeefah(wazeefahId: string, score: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    await Wazeefah.findByIdAndUpdate(wazeefahId, { 
      isApproved: true,
      authenticityScore: score 
    });
    
    revalidatePath('/wazeefahs');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectWazeefah(wazeefahId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    await Wazeefah.findByIdAndDelete(wazeefahId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAndPublishWazeefah(
  title: string,
  description: string,
  category: 'Rizq' | 'Protection' | 'Illness' | 'Anxiety' | 'Exams' | 'Marriage' | 'Forgiveness' | 'Parents' | 'Children',
  instructions: string[],
  score: number
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== 'admin') {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    const mongoose = (await import('mongoose')).default;
    const User = mongoose.models.User;
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('Admin user not found');

    const wazeefah = await Wazeefah.create({
      title,
      description,
      category,
      instructions,
      submittedBy: user._id,
      isApproved: true,
      authenticityScore: score
    });

    revalidatePath('/wazeefahs');
    revalidatePath('/admin');
    return { success: true, wazeefah: JSON.parse(JSON.stringify(wazeefah)) };
  } catch (error: any) {
    console.error('Direct publication failed:', error);
    return { success: false, error: error.message };
  }
}

