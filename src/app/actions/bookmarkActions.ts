'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { QuranBookmark } from '@/models/QuranBookmark';
import { HadithBookmark } from '@/models/HadithBookmark';

// ==================== QURAN BOOKMARKS ====================

export async function toggleQuranBookmark(surahNumber: number, ayahNumber: number, note?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const query = { userId: user._id, surahNumber, ayahNumber };
    const existing = await QuranBookmark.findOne(query);

    if (existing) {
      await QuranBookmark.deleteOne(query);
      return { success: true, bookmarked: false };
    } else {
      await QuranBookmark.create({
        ...query,
        note,
      });
      return { success: true, bookmarked: true };
    }
  } catch (error: any) {
    console.error('Error toggling Quran bookmark:', error);
    return { success: false, error: error.message };
  }
}

export async function isQuranBookmarked(surahNumber: number, ayahNumber: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return false;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return false;

    const existing = await QuranBookmark.findOne({ userId: user._id, surahNumber, ayahNumber });
    return !!existing;
  } catch (error) {
    console.error('Error checking Quran bookmark:', error);
    return false;
  }
}

export async function getQuranBookmarks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return [];

    const bookmarks = await QuranBookmark.find({ userId: user._id }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error fetching Quran bookmarks:', error);
    return [];
  }
}

// ==================== HADITH BOOKMARKS ====================

export async function toggleHadithBookmark(collectionName: string, bookNumber: string, hadithNumber: string, note?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const query = { userId: user._id, collectionName, hadithNumber };
    const existing = await HadithBookmark.findOne(query);

    if (existing) {
      await HadithBookmark.deleteOne(query);
      return { success: true, bookmarked: false };
    } else {
      await HadithBookmark.create({
        ...query,
        bookNumber,
        note,
      });
      return { success: true, bookmarked: true };
    }
  } catch (error: any) {
    console.error('Error toggling Hadith bookmark:', error);
    return { success: false, error: error.message };
  }
}

export async function isHadithBookmarked(collectionName: string, hadithNumber: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return false;

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return false;

    const existing = await HadithBookmark.findOne({ userId: user._id, collectionName, hadithNumber });
    return !!existing;
  } catch (error) {
    console.error('Error checking Hadith bookmark:', error);
    return false;
  }
}

export async function getHadithBookmarks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return [];

    const bookmarks = await HadithBookmark.find({ userId: user._id }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error fetching Hadith bookmarks:', error);
    return [];
  }
}
