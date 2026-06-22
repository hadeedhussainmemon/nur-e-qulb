import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { withLogging } from '@/lib/logger';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Invalid gender' }) }),
  city: z.string().optional(),
  country: z.string().optional(),
  madhab: z.string().optional(),
  calculationMethod: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 0. Rate Limiting (5 requests per 15 minutes)
    const rateLimit = await checkRateLimit(req, 'register', 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    // 1. Input Validation
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
    }
    
    const { name, email, password, gender, city, country, madhab, calculationMethod } = parseResult.data;

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'An unexpected error occurred during registration.' }, { status: 500 });
    }

    const userId = new mongoose.Types.ObjectId();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Transaction for atomic creation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const settings = await Settings.create([{
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
      }], { session });

      await User.create([{
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
        settingsId: settings[0]._id,
        role: 'user',
      }], { session });

      await session.commitTransaction();
    } catch (dbError) {
      await session.abortTransaction();
      throw dbError; // caught by outer block
    } finally {
      session.endSession();
    }

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    // 3. Generic error message to prevent leaking system details
    return NextResponse.json({ error: 'Registration failed due to a server error. Please try again later.' }, { status: 500 });
  }
}
