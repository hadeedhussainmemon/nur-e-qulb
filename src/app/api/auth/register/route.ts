import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const { name, email, password, gender, city, country, madhab, calculationMethod } = await req.json();

    if (!name || !email || !password || !gender) {
      return NextResponse.json({ error: 'Name, email, password, and gender are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Generate user ID beforehand to link Settings and User correctly
    const userId = new mongoose.Types.ObjectId();

    // Create settings first
    const settings = await Settings.create({
      userId,
      prayerCalculationMethod: calculationMethod || 'ISNA',
      madhab: madhab || 'Hanafi',
      notifications: {
        prayerReminders: true,
        dailyAyah: true,
        dailyHadith: true,
        fridayReminders: true,
        ramadanReminders: true,
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    await User.create({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      isGuest: false,
      gender,
      location: {
        city: city || 'Makkah',
        country: country || 'Saudi Arabia',
        latitude: 0,
        longitude: 0,
      },
      settingsId: settings._id,
      role: 'user',
    });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
