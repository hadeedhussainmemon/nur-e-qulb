'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings2, Bell, ShieldAlert, CalendarHeart, MoonStar, MapPin, Sparkles, Loader2, Check, Palette, User } from 'lucide-react';
import { applyTheme } from '@/components/layout/ThemeSyncEngine';
import { getCurrentUser, updateUserSettings, updateUserProfile } from '@/app/actions/authActions';
import { isPeriodActive, togglePeriodState } from '@/app/actions/periodActions';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User details
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<string>('other');
  const [city, setCity] = useState('Makkah');
  const [country, setCountry] = useState('Saudi Arabia');

  // Mode States
  const [womenMode, setWomenMode] = useState(false);
  const [fridayMode, setFridayMode] = useState(true);
  const [ramadanMode, setRamadanMode] = useState(false);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [dailyAyah, setDailyAyah] = useState(true);
  const [dailyHadith, setDailyHadith] = useState(true);

  // Preference States
  const [madhab, setMadhab] = useState('Hanafi');
  const [calculationMethod, setCalculationMethod] = useState('ISNA');
  const [activeTheme, setActiveTheme] = useState('default');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (user) {
          setName(user.name || '');
          setGender(user.gender || 'other');
          if (user.location) {
            setCity(user.location.city || 'Makkah');
            setCountry(user.location.country || 'Saudi Arabia');
          }

          if (user.settingsId) {
            const s = user.settingsId;
            setMadhab(s.madhab || 'Hanafi');
            setCalculationMethod(s.prayerCalculationMethod || 'ISNA');
            const savedTheme = s.theme || 'default';
            setActiveTheme(savedTheme);
            if (s.notifications) {
              setFridayMode(s.notifications.fridayReminders);
              setRamadanMode(s.notifications.ramadanReminders);
              setPrayerReminders(s.notifications.prayerReminders);
              setDailyAyah(s.notifications.dailyAyah);
              setDailyHadith(s.notifications.dailyHadith);
            }
          }
        }

        if (user?.gender === 'female') {
          const periodActive = await isPeriodActive();
          setWomenMode(periodActive);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      loadSettings();
    }
  }, [session]);

  const handleDetectLocation = () => {
    setDetecting(true);
    setSuccessMsg(null);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          if (!res.ok) throw new Error('Failed to fetch address');
          const data = await res.json();

          const newCity = data.address.city || data.address.town || data.address.village || data.address.county || '';
          const newCountry = data.address.country || '';

          setCity(newCity);
          setCountry(newCountry);
          setSuccessMsg('Location auto-detected! Click Save to apply.');
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (error) {
          alert('Failed to retrieve city and country from coordinates.');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        alert('Location access denied or unavailable.');
        setDetecting(false);
      }
    );
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMsg(null);

    try {
      // Save profile
      const profileRes = await updateUserProfile(name, gender as 'male' | 'female' | 'other', city, country);
      if (!profileRes.success) {
        alert('Failed to save profile: ' + profileRes.error);
        setSaving(false);
        return;
      }

      // Save notification settings and juristic methods
      const settingsRes = await updateUserSettings({
        madhab,
        prayerCalculationMethod: calculationMethod,
        theme: activeTheme,
        notifications: {
          prayerReminders,
          dailyAyah,
          dailyHadith,
          fridayReminders: fridayMode,
          ramadanReminders: ramadanMode,
        },
      });

      if (!settingsRes.success) {
        alert('Failed to save settings: ' + settingsRes.error);
        setSaving(false);
        return;
      }

      // Force NextAuth to update session with new DB data
      await updateSession();

      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWomenMode = async (checked: boolean) => {
    setWomenMode(checked);
    const todayStr = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
    await togglePeriodState(checked, todayStr);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Settings & Preferences</h2>
          <p className="text-muted-foreground mt-1">Configure your personalized Islamic productivity experience.</p>
        </div>
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Personal Profile */}
        <Card className="border-slate-200 dark:border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> Personal Profile
            </CardTitle>
            <CardDescription>Manage your personal information and location settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-background border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">City</label>
                  <button type="button" onClick={handleDetectLocation} disabled={detecting} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1">
                    {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    Auto-Detect
                  </button>
                </div>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Makkah"
                  className="bg-background border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Country</label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Saudi Arabia"
                  className="bg-background border-slate-200 dark:border-slate-800 focus:ring-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Calculation Preferences */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" /> Calculation Settings
            </CardTitle>
            <CardDescription>Configure calculation settings for prayer times.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Juristic School (Asr)</label>
              <select
                value={madhab}
                onChange={(e) => setMadhab(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Hanafi">Hanafi (Later Asr time)</option>
                <option value="Standard">Standard (Shafi'i, Maliki, Hanbali)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calculation Method</label>
              <select
                value={calculationMethod}
                onChange={(e) => setCalculationMethod(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ISNA">Islamic Society of North America (ISNA)</option>
                <option value="MWL">Muslim World League (MWL)</option>
                <option value="Karachi">University of Islamic Sciences, Karachi</option>
                <option value="Makkah">Umm al-Qura University, Makkah</option>
                <option value="Egypt">Egyptian General Authority of Survey</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" /> Notification Center
            </CardTitle>
            <CardDescription>Manage daily alarms and motivational prompts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-base font-medium">Adhan & Prayer Alerts</p>
                <p className="text-sm text-muted-foreground">Receive push notifications immediately at local prayer times.</p>
              </div>
              <Switch checked={prayerReminders} onCheckedChange={setPrayerReminders} disabled={womenMode} />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-base font-medium">Daily Quran Ayah</p>
                <p className="text-sm text-muted-foreground">Get daily inspirational verse notifications in the morning.</p>
              </div>
              <Switch checked={dailyAyah} onCheckedChange={setDailyAyah} />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-base font-medium">Daily Hadith Alerts</p>
                <p className="text-sm text-muted-foreground">Receive authentic snippets of Sunnah directly on your dashboard.</p>
              </div>
              <Switch checked={dailyHadith} onCheckedChange={setDailyHadith} />
            </div>
          </CardContent>
        </Card>

        {/* Special Modes (Women mode / Friday / Ramadan) */}
        <Card className="border-emerald-100 dark:border-emerald-900 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Specialized Islamic Modes
            </CardTitle>
            <CardDescription>Tailor the app features dynamically to your specific lifecycle requirements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Women Mode - Female Users Only */}
            {gender === 'female' ? (
              <div className="flex items-center justify-between space-x-4 p-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/20 dark:bg-rose-950/10">
                <div className="flex items-start space-x-4">
                  <ShieldAlert className="w-6 h-6 text-rose-500 mt-1" />
                  <div>
                    <p className="text-base font-semibold text-rose-800 dark:text-rose-400">Women's Period Mode</p>
                    <p className="text-sm text-rose-600/80 dark:text-rose-400/70">
                      Toggling this ON excuses you from prayer requirements without breaking streaks, and automates make-up fast targets.
                    </p>
                  </div>
                </div>
                <Switch checked={womenMode} onCheckedChange={handleToggleWomenMode} className="data-[state=checked]:bg-rose-500" />
              </div>
            ) : gender === 'male' ? (
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-sm">
                ℹ️ Women's Period Mode settings are hidden because your profile gender is set to Male.
              </div>
            ) : null}

            {/* Friday Mode */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-start space-x-4">
                <CalendarHeart className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-base font-medium">Friday Jumu'ah Mode</p>
                  <p className="text-sm text-muted-foreground">Enable weekly notifications for Surah Kahf and Friday Salawat goals.</p>
                </div>
              </div>
              <Switch checked={fridayMode} onCheckedChange={setFridayMode} />
            </div>

            {/* Ramadan Mode */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-start space-x-4">
                <MoonStar className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <p className="text-base font-medium">Ramadan Mode</p>
                  <p className="text-sm text-muted-foreground">Activate Sehri/Iftar dashboards, Taraweeh logs, and fasting trackers.</p>
                </div>
              </div>
              <Switch checked={ramadanMode} onCheckedChange={setRamadanMode} />
            </div>
          </CardContent>
        </Card>

        {/* Premium Theme Selector */}
        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-violet-500" /> Premium App Themes
            </CardTitle>
            <CardDescription>Choose a colour palette that resonates with your spirit. Changes apply instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'default', label: 'Default Emerald', gradient: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-500' },
                { id: 'gold',    label: 'Makkah Gold',    gradient: 'from-yellow-500 to-amber-500',  ring: 'ring-amber-500'   },
                { id: 'rose',    label: 'Medina Rose',    gradient: 'from-rose-500 to-pink-500',     ring: 'ring-rose-500'    },
                { id: 'indigo',  label: 'Royal Indigo',   gradient: 'from-indigo-500 to-violet-500', ring: 'ring-indigo-500'  },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setActiveTheme(theme.id);
                    applyTheme(theme.id);
                    localStorage.setItem('nur-theme', theme.id);
                  }}
                  className={`relative rounded-xl p-4 border-2 transition-all text-white bg-gradient-to-br ${theme.gradient} ${
                    activeTheme === theme.id
                      ? `border-white dark:border-slate-100 ring-2 ${theme.ring} shadow-lg scale-105`
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {activeTheme === theme.id && (
                    <span className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                      <Check className="w-3 h-3 text-slate-800" />
                    </span>
                  )}
                  <span className="block text-xs font-bold drop-shadow">{theme.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Theme preference is saved when you click &quot;Save Settings&quot;.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSaveSettings} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
