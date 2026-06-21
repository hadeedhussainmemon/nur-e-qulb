import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

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
        const dbUser = await User.findOne({ email: token.email }).populate('settingsId').lean();
        if (dbUser) {
          token.id = (dbUser as any)._id.toString();
          token.name = (dbUser as any).name;
          token.role = (dbUser as any).role || 'user';
          token.gender = (dbUser as any).gender || 'other';
          token.location = (dbUser as any).location ? {
            city: (dbUser as any).location.city,
            country: (dbUser as any).location.country,
          } : null;
          token.settings = (dbUser as any).settingsId
            ? JSON.parse(JSON.stringify((dbUser as any).settingsId))
            : null;
        } else if (user) {
          token.id = user.id;
          token.name = user.name;
          token.role = (user as any).role || 'user';
          token.gender = 'other';
          token.location = null;
          token.settings = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).gender = token.gender;
        (session.user as any).location = token.location;
        (session.user as any).settings = token.settings;
      }
      return session;
    },
  },
};
