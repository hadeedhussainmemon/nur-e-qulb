'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Compass, Heart, MoonStar, Target, Clock, ArrowRight, BookMarked, Users, Sparkles, ChevronRight, CheckCircle2, Shield, Zap } from 'lucide-react';
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
  const { currentPrayer, nextPrayer, data: timesData } = usePrayerTimes('Makkah', 'Saudi Arabia');

  useEffect(() => {
    // Pick randomly on client mount to avoid hydration mismatch
    setSunnah(RANDOM_SUNNAHS[Math.floor(Math.random() * RANDOM_SUNNAHS.length)]);
    setWazeefah(RANDOM_WAZEEFAHS[Math.floor(Math.random() * RANDOM_WAZEEFAHS.length)]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      
      {/* Header/Nav for Landing Page */}
      <header className="absolute top-0 w-full z-50 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-cover" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Nur E Qalbb</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-emerald-100 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/register">
            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 rounded-full px-6 font-semibold shadow-lg shadow-emerald-900/20">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-900 text-white border-b border-emerald-900/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px] opacity-60" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-[128px] opacity-60" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium backdrop-blur-md">
            <MoonStar className="w-4 h-4" />
            <span>The Premium Islamic Productivity Suite</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight">
            Elevate Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Spiritual Journey
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            A beautiful, distraction-free companion to track your prayers, read the Quran, maintain Wazeefahs, and keep your heart connected to Allah.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-500/25 w-full sm:w-auto transition-all hover:scale-105">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-full w-full sm:w-auto backdrop-blur-md">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Highlights Row (Floating over hero border) */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-20 w-full mb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl mb-6">
                  <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sunnah of the Day</h3>
                <p className="text-xl md:text-2xl font-serif text-slate-800 dark:text-slate-200 leading-snug">
                  "{sunnah.text}"
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-6">— {sunnah.source}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="inline-flex p-3 bg-rose-500/10 rounded-2xl mb-6">
                  <BookMarked className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Daily Wazeefah Reminder</h3>
                <p className="text-xl md:text-2xl font-serif text-slate-800 dark:text-slate-200 leading-snug">
                  {wazeefah.text}
                </p>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium w-fit">
                <Clock className="w-4 h-4 text-emerald-500" />
                {wazeefah.time}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Everything you need, in one place</h2>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Nur E Qalbb replaces half a dozen apps with a beautifully integrated, premium experience designed for focus.</p>
          </div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Immersive Quran Reader</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Experience the Holy Quran like never before. With beautiful typography, seamless audio playback, translations, and distraction-free reading modes.
                </p>
                <ul className="space-y-3">
                  {['Word-by-word tracking', 'Multiple reciters', 'Tafsir & Translations', 'Save bookmarks & last read'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Mockup UI representation */}
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="text-emerald-600 font-bold font-serif text-xl">Surah Al-Mulk</div>
                    <div className="text-slate-400 text-sm">Ayah 1</div>
                  </div>
                  <div className="text-right font-arabic text-4xl leading-[2.5] text-slate-800 dark:text-slate-200" dir="rtl">
                    تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    Blessed is He in whose hand is dominion, and He is over all things competent.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Lifetime Qaza Tracker</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Never lose track of your religious obligations. Log your missed prayers and fasts, visualize your progress, and build a consistent habit of making them up.
                </p>
                <ul className="space-y-3">
                  {['Automated calculators', 'Visual progress charts', 'Fasting & Prayer separation', 'Daily log streaks'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <div className="text-sm font-medium text-slate-500 mb-1">Total Qaza Prayers</div>
                       <div className="text-3xl font-bold text-slate-900 dark:text-white">1,420 <span className="text-lg text-slate-400 font-normal">remaining</span></div>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                       <Shield className="text-indigo-500 w-6 h-6" />
                     </div>
                   </div>
                   <div className="space-y-3">
                     {['Fajr', 'Dhuhr', 'Asr'].map((p, i) => (
                       <div key={p} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                         <span className="font-semibold text-slate-700 dark:text-slate-300">{p}</span>
                         <div className="flex items-center gap-4">
                           <span className="font-mono text-sm text-slate-500">{284 - i * 12} left</span>
                           <Button size="sm" variant="outline" className="h-8 rounded-md bg-white dark:bg-slate-950">Log -1</Button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Tasbih & Adhkar</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  A satisfying, tactile counting experience with haptic feedback. Choose from preset authentic Adhkar or create your custom Dhikr goals.
                </p>
                <Link href="/register" className="inline-flex items-center text-teal-600 dark:text-teal-400 font-bold hover:underline">
                  Create your first goal <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center min-h-[300px]">
                <div className="w-48 h-48 rounded-full bg-white dark:bg-slate-950 shadow-[0_0_50px_rgba(20,184,166,0.15)] border-4 border-teal-50 dark:border-teal-900/20 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                   <div className="text-5xl font-mono font-bold text-slate-900 dark:text-white">33</div>
                   <div className="text-sm font-medium text-teal-600 mt-2">SubhanAllah</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-emerald-600 dark:bg-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to transform your habits?</h2>
          <p className="text-emerald-100 text-lg md:text-xl max-w-2xl mx-auto">Join thousands of Muslims building a stronger connection with their faith through Nur E Qalbb.</p>
          <div className="pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-16 px-10 text-xl font-bold rounded-full shadow-2xl hover:scale-105 transition-transform">
                Create Free Account
              </Button>
            </Link>
            <p className="mt-6 text-sm text-emerald-200">No credit card required. Fast sign-up with Google.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
              </div>
              <span className="text-xl font-bold text-white">Nur E Qalbb</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Your comprehensive Islamic productivity suite. Designed with elegance and built to help you nurture your faith without distractions.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Features</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Quran Reader</Link></li>
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Smart Tasbih</Link></li>
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Qaza Tracker</Link></li>
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Daily Wazeefahs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal & Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Nur E Qalbb. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm">
            Made with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> by Hadeed Hussain
          </div>
        </div>
      </footer>
    </div>
  );
}
