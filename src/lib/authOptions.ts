import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

interface DbUser {
  _id: any;
  name: string;
  email: string;
  role: string;
  gender: string;
  onboardingCompleted: boolean;
  hijriAdjustment: number;
  location?: { city: string; country: string };
  settingsId?: any;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase();
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user || !user.password) {
          throw new Error('No user found');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Re-issue token once per day max
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            name: user.name || 'Google User',
            email: user.email,
            googleId: user.id,
            isGuest: false,
            role: 'user',
            gender: 'other', // Default gender, can be customized later in Settings
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On first sign-in (user object exists) OR explicit update trigger — hit the DB
      if (user || trigger === 'update') {
        await connectToDatabase();
        const dbUserMatch = await User.findOne({ email: token.email }).populate('settingsId').lean();
        
        if (dbUserMatch) {
          const dbUser = dbUserMatch as unknown as DbUser;
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.role = dbUser.role || 'user';
          token.gender = dbUser.gender || 'other';
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
          token.hijriAdjustment = dbUser.hijriAdjustment ?? 0;
          token.location = dbUser.location ? {
            city: dbUser.location.city,
            country: dbUser.location.country,
          } : null;
          token.settings = dbUser.settingsId
            ? JSON.parse(JSON.stringify(dbUser.settingsId))
            : null;
        } else if (user) {
          token.id = user.id;
          token.name = user.name;
          token.role = (user as any).role || 'user';
          token.gender = 'other';
          token.onboardingCompleted = false;
          token.hijriAdjustment = 0;
          token.location = null;
          token.settings = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any;
        u.id = token.id;
        u.role = token.role;
        u.gender = token.gender;
        u.onboardingCompleted = token.onboardingCompleted;
        u.hijriAdjustment = token.hijriAdjustment;
        u.location = token.location;
        u.settings = token.settings;
      }
      return session;
    },
  },
};
