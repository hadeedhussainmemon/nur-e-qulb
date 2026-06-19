'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Compass, Heart, MoonStar, Target, Clock, ArrowRight, BookMarked, Users, Sparkles } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

// Hardcoded array of highly authentic Sunnahs
const RANDOM_SUNNAHS = [
  { text: "Smiling in the face of your brother is an act of charity.", source: "Tirmidhi" },
  { text: "Using the Miswak cleanses the mouth and pleases the Lord.", source: "Nasa'i" },
  { text: "Sleeping on your right side.", source: "Bukhari" },
  { text: "Saying 'Bismillah' before eating and 'Alhamdulillah' after.", source: "Muslim" },
  { text: "Removing a harmful object from the path is charity.", source: "Bukhari" },
  { text: "Greeting people with 'As-salamu alaykum', even those you don't know.", source: "Bukhari" }
];

// Hardcoded array of basic Daily Wazeefahs
const RANDOM_WAZEEFAHS = [
  { text: "SubhanAllah (33x), Alhamdulillah (33x), Allahu Akbar (34x)", time: "After every Fard Prayer" },
  { text: "Ayatul Kursi", time: "After every Fard Prayer & before sleeping" },
  { text: "SubhanAllahi wa bihamdihi (100x)", time: "Morning and Evening" },
  { text: "Astaghfirullah (100x)", time: "Daily" },
  { text: "Surah Al-Mulk", time: "Every night before sleeping" }
];

export function PublicHome() {
  const [sunnah, setSunnah] = useState(RANDOM_SUNNAHS[0]);
  const [wazeefah, setWazeefah] = useState(RANDOM_WAZEEFAHS[0]);
  const { currentPrayer, nextPrayer, data: timesData } = usePrayerTimes('Makkah', 'Saudi Arabia'); // Default for public view

  useEffect(() => {
    // Pick randomly on client mount to avoid hydration mismatch
    setSunnah(RANDOM_SUNNAHS[Math.floor(Math.random() * RANDOM_SUNNAHS.length)]);
    setWazeefah(RANDOM_WAZEEFAHS[Math.floor(Math.random() * RANDOM_WAZEEFAHS.length)]);
  }, []);

  const features = [
    {
      title: "Interactive Quran",
      description: "Read, listen, and follow along with word-by-word highlighting and audio playback.",
      icon: BookOpen,
      color: "bg-emerald-500/10 text-emerald-500"
    },
    {
      title: "Smart Tasbih",
      description: "A beautiful, offline-ready counter with preset Adhkar and satisfying audio feedback.",
      icon: Target,
      color: "bg-teal-500/10 text-teal-500"
    },
    {
      title: "Lifetime Qaza Tracker",
      description: "Keep track of missed prayers and fasts from your past and make them up consistently.",
      icon: Clock,
      color: "bg-indigo-500/10 text-indigo-500"
    },
    {
      title: "Wazeefah & Habits",
      description: "Log your daily spiritual habits, track your streaks, and read daily authentic Hadiths.",
      icon: Heart,
      color: "bg-rose-500/10 text-rose-500"
    },
    {
      title: "Qibla & Mosques",
      description: "Find the exact Qibla direction anywhere in the world and locate nearby Masjids.",
      icon: Compass,
      color: "bg-amber-500/10 text-amber-500"
    },
    {
      title: "Family Streaks",
      description: "Invite your family, take part in spiritual challenges together, and motivate each other.",
      icon: Users,
      color: "bg-blue-500/10 text-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-32 border-b border-emerald-900/30">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-2xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-800">
              <Image src="/logo.png" alt="Nur-e-Qulb Logo" width={96} height={96} className="object-cover" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-4">
            <MoonStar className="w-4 h-4" />
            <span>Welcome to Nur-e-Qulb</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mt-0">
            Your Digital <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Islamic Companion
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Everything you need for your daily spiritual journey. Track prayers, read the Quran, log Wazeefahs, and keep your heart connected to Allah.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-slate-700 hover:bg-slate-800 hover:text-emerald-400 w-full sm:w-auto text-emerald-400 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 space-y-8">
        {/* Spiritual Showcase Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Sunnah */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl">
            <CardContent className="p-6 md:p-8 flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sunnah Showcase</h3>
                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  "{sunnah.text}"
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">— {sunnah.source}</p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Wazeefah */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl">
            <CardContent className="p-6 md:p-8 flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl shrink-0">
                <BookMarked className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Wazeefah Reminder</h3>
                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  {wazeefah.text}
                </p>
                <div className="inline-flex items-center gap-1.5 text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  {wazeefah.time}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Makkah Prayers (Demo) */}
        {timesData && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <Compass className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div className="font-medium text-emerald-900 dark:text-emerald-100">
                Live from Makkah, SA
              </div>
            </div>
            <div className="flex gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                const pName = prayer.toLowerCase();
                const isNext = nextPrayer?.name.toLowerCase() === pName;
                return (
                  <div key={prayer} className={`flex flex-col items-center ${isNext ? 'opacity-100 scale-110 font-bold text-emerald-600 dark:text-emerald-400' : 'opacity-60 text-slate-700 dark:text-slate-400'}`}>
                    <span className="text-xs uppercase tracking-wider mb-1">{prayer}</span>
                    <span className="font-mono text-sm">{timesData.data.timings[prayer as keyof typeof timesData.data.timings] || '--:--'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="py-12">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything in one place</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">No need for multiple apps. Nur-e-Qulb provides a holistic environment to nurture your faith, track your progress, and build lifelong habits.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
