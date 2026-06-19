'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoonStar, User, Mail, Lock, MapPin, Settings2, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'female', // Default to female (often has more customized states like Period mode)
    city: 'Makkah',
    country: 'Saudi Arabia',
    madhab: 'Hanafi',
    calculationMethod: 'ISNA',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill out all account fields');
        return;
      }
      setError(null);
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically sign in the user
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        router.push('/login?message=Registered successfully. Please log in.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border-slate-800 text-slate-100 shadow-2xl relative z-10 transition-all duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-2 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <MoonStar className="w-6 h-6 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            Create your account
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Step {step} of 2: {step === 1 ? 'Account Credentials' : 'Islamic Preferences'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={nextStep} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Fatima Ahmad"
                    className="pl-10 bg-slate-950/50 border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className="pl-10 bg-slate-950/50 border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-10 bg-slate-950/50 border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="female" className="bg-slate-900 text-white">Female (Women Mode enabled)</option>
                  <option value="male" className="bg-slate-900 text-white">Male</option>
                  <option value="other" className="bg-slate-900 text-white">Prefer not to say</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 mt-6">
                Next Step <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Makkah"
                      className="pl-10 bg-slate-950/50 border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Saudi Arabia"
                      className="pl-10 bg-slate-950/50 border-slate-800 focus:ring-emerald-500 focus:border-emerald-500 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Juristic School (Asr Time)</label>
                <select
                  name="madhab"
                  value={formData.madhab}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Hanafi" className="bg-slate-900 text-white">Hanafi (Later Asr time)</option>
                  <option value="Standard" className="bg-slate-900 text-white">Standard (Shafi'i, Maliki, Hanbali)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Calculation Method</label>
                <select
                  name="calculationMethod"
                  value={formData.calculationMethod}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ISNA" className="bg-slate-900 text-white">Islamic Society of North America (ISNA)</option>
                  <option value="MWL" className="bg-slate-900 text-white">Muslim World League (MWL)</option>
                  <option value="Karachi" className="bg-slate-900 text-white">University of Islamic Sciences, Karachi</option>
                  <option value="Makkah" className="bg-slate-900 text-white">Umm al-Qura University, Makkah</option>
                  <option value="Egypt" className="bg-slate-900 text-white">Egyptian General Authority of Survey</option>
                  <option value="Tehran" className="bg-slate-900 text-white">Institute of Geophysics, University of Tehran</option>
                  <option value="Gulf" className="bg-slate-900 text-white">Gulf Region</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" onClick={prevStep} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      Complete Signup <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900/10 backdrop-blur-md px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign Up with Google
              </Button>
            </>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-slate-800/50 py-4">
          <p className="text-slate-400 text-xs">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
