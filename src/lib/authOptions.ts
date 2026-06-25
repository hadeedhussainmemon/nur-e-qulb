import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Prevent bundlers from tree-shaking these models.
// Mongoose requires model schemas to be loaded and registered in its registry before we can use .populate()
const _forceSettings = Settings.modelName;
const _forceUser = User.modelName;


async function logToDatabase(level: 'error' | 'warn' | 'debug', code: string, metadata: any) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (db) {
      let serializedMeta = '';
      try {
        if (metadata instanceof Error) {
          serializedMeta = JSON.stringify({
            message: metadata.message,
            stack: metadata.stack,
            name: metadata.name,
          });
        } else if (metadata) {
          serializedMeta = JSON.stringify(metadata, Object.getOwnPropertyNames(metadata));
        }
      } catch (e) {
        serializedMeta = `[Unserializable metadata: ${e instanceof Error ? e.message : String(e)}]`;
      }

      await db.collection('nextauth_logs').insertOne({
        timestamp: new Date(),
        level,
        code,
        metadata: serializedMeta,
        env: process.env.NODE_ENV,
      });
    }
  } catch (err) {
    console.error('Failed to write NextAuth log to MongoDB:', err);
  }
}

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
      try {
        console.log('[NextAuth Callback: signIn] Initiated', {
          email: user.email,
          name: user.name,
          provider: account?.provider,
        });

        if (account?.provider === 'google' && user.email) {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            console.log('[NextAuth Callback: signIn] Creating new user for Google login');
            await User.create({
              name: user.name || 'Google User',
              email: user.email,
              googleId: user.id,
              isGuest: false,
              role: 'user',
              gender: 'other', // Default gender, can be customized later in Settings
            });
          } else {
            console.log('[NextAuth Callback: signIn] Existing user found matching email:', user.email);
            if (!existingUser.googleId) {
              console.log('[NextAuth Callback: signIn] Linking Google ID to existing user account');
              existingUser.googleId = user.id;
              await existingUser.save();
            }
          }
        }
        return true;
      } catch (error) {
        console.error('[NextAuth Callback: signIn] Error during execution:', error);
        // Throwing error inside callback sends details to NextAuth client, resulting in Callback error
        throw error;
      }
    },
    async jwt({ token, user, trigger }) {
      try {
        // On first sign-in (user object exists) OR explicit update trigger — hit the DB
        if (user || trigger === 'update') {
          console.log('[NextAuth Callback: jwt] Fetching user details for token mapping', {
            email: token.email,
            trigger,
          });
          
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
      } catch (error) {
        console.error('[NextAuth Callback: jwt] Error during execution:', error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
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
      } catch (error) {
        console.error('[NextAuth Callback: session] Error during execution:', error);
        throw error;
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
      logToDatabase('error', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warn]', code);
      logToDatabase('warn', code, null);
    },
    debug(code, metadata) {
      console.log('[NextAuth Debug]', code, metadata);
      logToDatabase('debug', code, metadata);
    },
  },
};
