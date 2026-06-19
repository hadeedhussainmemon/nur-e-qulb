'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoonStar, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg) setMessage(msg);

    const err = searchParams.get('error');
    if (err) {
      if (err === 'CredentialsSignin') {
        setError('Invalid email or password');
      } else {
        setError(err);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 bg-white dark:bg-slate-950">
        
        <div className="mb-10 lg:hidden flex items-center gap-3">
           <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
             <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-cover" />
           </div>
           <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Nur E Qalbb</span>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to your account to continue your spiritual journey.
            </p>
          </div>

          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-14 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-semibold text-base transition-all rounded-xl"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-950 px-4 text-slate-500 font-semibold tracking-wider">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-emerald-500 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <Link href="#" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-emerald-500 text-base"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Image Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center overflow-hidden border-l border-slate-800">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-slate-900" />
        
        <div className="absolute top-12 left-12 flex items-center gap-3">
           <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl">
             <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-cover" />
           </div>
           <span className="text-2xl font-bold text-white tracking-wide">Nur E Qalbb</span>
        </div>

        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
            <MoonStar className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Your Digital Islamic Companion</h2>
          <p className="text-lg text-emerald-100/80 leading-relaxed">
            Track your prayers, read the Quran, and nurture your faith in a beautifully designed, distraction-free environment.
          </p>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
