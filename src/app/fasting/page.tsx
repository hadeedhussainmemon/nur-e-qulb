'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, CheckCircle, Calendar, Plus, Loader2, Minus, X, Info } from 'lucide-react';
import { getFastingLogs, logFast, getFastingSummary, adjustFastsMissed, getLifetimeQazaFasts, updateLifetimeQazaFasts } from '@/app/actions/fastingActions';
import { getCurrentUser } from '@/app/actions/authActions';

export default function FastingTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [gender, setGender] = useState('other');
  const [summary, setSummary] = useState({
    totalFasts: 0,
    sunnahFasts: 0,
    makeupsRemaining: 0,
  });
  const [lifetimeQazaCount, setLifetimeQazaCount] = useState(0);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    type: 'sunnah_monday',
    status: 'completed',
    notes: '',
  });

  // Helper to convert date to en-CA format (YYYY-MM-DD)
  const toLocalDateString = (d: Date) => {
    return d.toLocaleDateString('en-CA');
  };

  // 1. Get next 4 Mondays and Thursdays
  const getUpcomingSunnahDays = () => {
    const days: { date: Date; type: string; label: string }[] = [];
    const current = new Date();
    
    for (let i = 1; i <= 30 && days.length < 4; i++) {
      const nextDay = new Date();
      nextDay.setDate(current.getDate() + i);
      const dayOfWeek = nextDay.getDay(); // 1 = Mon, 4 = Thu
      if (dayOfWeek === 1) {
        days.push({ 
          date: nextDay, 
          type: 'sunnah_monday', 
          label: 'Sunnah Monday' 
        });
      } else if (dayOfWeek === 4) {
        days.push({ 
          date: nextDay, 
          type: 'sunnah_thursday', 
          label: 'Sunnah Thursday' 
        });
      }
    }
    return days.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // 2. Kuwaiti algorithm for Hijri calculation
  const getHijriDate = (date: Date) => {
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const d = date.getDate();
    
    let jd = 0;
    if (m < 3) {
      const newY = y - 1;
      const newM = m + 12;
      jd = Math.floor(365.25 * newY) + Math.floor(30.6001 * (newM + 1)) + d + 1720995;
    } else {
      jd = Math.floor(365.25 * y) + Math.floor(30.6001 * (m + 1)) + d + 1720995;
    }
    
    if (jd > 2299160) {
      const a = Math.floor((y - 100) / 100);
      const b = Math.floor(a / 4);
      jd = jd + 2 - a + b;
    }
    
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const lPart = l - 10631 * n + 354;
    const j = Math.floor((10985 - lPart) / 5316) * Math.floor((50 * lPart + 27200) / 17719) + Math.floor(lPart / 5670) * Math.floor((43 * lPart + 24205) / 15307);
    const lRemaining = lPart - Math.floor((30 - j) / 15) * Math.floor((17719 * j + 14334) / 50) - Math.floor(j / 30) * Math.floor((15307 * j + 22426) / 43) + 29;
    
    const hijriMonth = Math.floor((24 * lRemaining) / 709);
    const hijriDay = lRemaining - Math.floor((709 * hijriMonth) / 24);
    const hijriYear = 30 * n + j - 30;
    
    return { day: hijriDay, month: hijriMonth, year: hijriYear };
  };

  const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
  ];

  // 3. Get white days that are today or in the future
  const getWhiteDays = () => {
    const current = new Date();
    const days: { date: Date; type: string; label: string }[] = [];
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    for (let offset = -5; offset <= 25; offset++) {
      const checkDate = new Date();
      checkDate.setDate(current.getDate() + offset);
      const hd = getHijriDate(checkDate);
      
      const checkStart = new Date(checkDate);
      checkStart.setHours(0,0,0,0);

      if (
        (hd.day === 13 || hd.day === 14 || hd.day === 15) &&
        checkStart.getTime() >= todayStart.getTime()
      ) {
        days.push({
          date: checkDate,
          type: 'white_days',
          label: `White Day (${hd.day} ${HIJRI_MONTHS[hd.month]})`
        });
      }
    }
    return days.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleQuickLog = async (dateStr: string, type: string, status: string) => {
    setLoading(true);
    try {
      const result = await logFast(dateStr, type, status);
      if (result.success) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setGender(user.gender || 'other');
      }
      const logsData = await getFastingLogs();
      setLogs(logsData);
      const summaryData = await getFastingSummary();
      setSummary(summaryData);
      const qazaCount = await getLifetimeQazaFasts();
      setLifetimeQazaCount(qazaCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustLifetimeQaza = async (change: number) => {
    // Optimistic Update
    setLifetimeQazaCount((prev) => Math.max(0, prev + change));

    const result = await updateLifetimeQazaFasts(change);
    if (result.success) {
      setLifetimeQazaCount(result.count ?? 0);
    } else {
      const qazaCount = await getLifetimeQazaFasts();
      setLifetimeQazaCount(qazaCount ?? 0);
    }
  };

  const handleAdjustMakeups = async (change: number) => {
    // Optimistic Update
    setSummary((prev) => ({
      ...prev,
      makeupsRemaining: Math.max(0, prev.makeupsRemaining + change),
    }));

    const result = await adjustFastsMissed(change);
    if (result.success) {
      const s = await getFastingSummary();
      setSummary(s);
    } else {
      loadData();
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);

    try {
      const result = await logFast(formData.date, formData.type, formData.status, formData.notes);
      if (result.success) {
        setIsOpen(false);
        // Reset form
        setFormData({
          date: new Date().toLocaleDateString('en-CA'),
          type: 'sunnah_monday',
          status: 'completed',
          notes: '',
        });
        // Reload data
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  const formatFastType = (type: string) => {
    switch (type) {
      case 'ramadan': return 'Ramadan Fast';
      case 'sunnah_monday': return 'Sunnah Monday';
      case 'sunnah_thursday': return 'Sunnah Thursday';
      case 'white_days': return 'Ayyam al-Bidh (White Days)';
      case 'ashura': return 'Ashura Fast';
      case 'arafah': return 'Arafah Fast';
      case 'makeup': return 'Qaza (Make-up) Fast';
      case 'nafl': return 'Nafl (Voluntary) Fast';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-1 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> Completed
        </span>
      );
    } else if (status === 'intended') {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 px-3 py-1 rounded-full animate-pulse">
          Intended
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 px-3 py-1 rounded-full">
          Broken
        </span>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="text-center space-y-4 py-8 border-b border-amber-100 dark:border-amber-900/30 relative">
        {/* Sparkle effects */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <Sun className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-amber-600 dark:text-amber-400">Fasting Tracker</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">Keep track of your Sunnah, Nafl, and missed Ramadan fasts throughout the year.</p>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl border animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground text-sm">Loading your fasting profile...</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-amber-500/5 border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-6 text-center space-y-2">
                <h3 className="text-4xl font-bold text-amber-600 dark:text-amber-400">{summary.totalFasts}</h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">Fasts Completed This Year</p>
              </CardContent>
            </Card>
            
            <Card className="bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/50">
              <CardContent className="p-6 text-center space-y-2">
                <h3 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{summary.sunnahFasts}</h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Sunnah Fasts Logged</p>
              </CardContent>
            </Card>

            <Card className="bg-rose-500/5 border-rose-200 dark:border-rose-900/50 relative overflow-hidden">
              <CardContent className="p-6 text-center space-y-3 flex flex-col justify-center items-center h-full">
                <div>
                  <h3 className="text-4xl font-bold text-rose-600 dark:text-rose-400">{summary.makeupsRemaining}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">Make-up Fasts Remaining</p>
                </div>

                {/* Adjust Missed Ramadan Fasts for Cycle or broken fasts */}
                <div className="flex gap-2 items-center mt-1">
                  <Button
                    onClick={() => handleAdjustMakeups(-1)}
                    disabled={summary.makeupsRemaining === 0}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-rose-200 bg-white dark:bg-slate-950 dark:border-rose-900"
                  >
                    <Minus className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                  <span className="text-xs font-bold text-rose-700/80 dark:text-rose-400/80">Adjust Qaza</span>
                  <Button
                    onClick={() => handleAdjustMakeups(1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-rose-200 bg-white dark:bg-slate-950 dark:border-rose-900"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-rose-500/5 border-rose-200 dark:border-rose-900/50 relative overflow-hidden">
              <CardContent className="p-6 text-center space-y-3 flex flex-col justify-center items-center h-full">
                <div>
                  <h3 className="text-4xl font-bold text-rose-600 dark:text-rose-400">{lifetimeQazaCount}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">Lifetime Qaza Fasts</p>
                </div>

                <div className="flex gap-2 items-center mt-1">
                  <Button
                    onClick={() => handleAdjustLifetimeQaza(-1)}
                    disabled={lifetimeQazaCount === 0}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-rose-200 bg-white dark:bg-slate-950 dark:border-rose-900"
                  >
                    <Minus className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                  <span className="text-xs font-bold text-rose-700/80 dark:text-rose-400/80">Adjust Qaza</span>
                  <Button
                    onClick={() => handleAdjustLifetimeQaza(1)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-rose-200 bg-white dark:bg-slate-950 dark:border-rose-900"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {gender === 'female' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
              <div className="text-xs text-rose-700 dark:text-rose-400">
                <strong>Cycle Tip:</strong> You can increment the **Make-up Fasts Remaining** counter manually using the `+` button whenever you miss fasting days due to your cycle. Once you fast the make-up day, log it as a **Qaza (Make-up) Fast** to automatically decrement the count!
              </div>
            </div>
          )}

          {/* Voluntary Fasting Planner */}
          <Card className="bg-white/40 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 backdrop-blur-sm rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>Voluntary Fasting Planner</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plan and track upcoming Sunnah fasting opportunities (Mondays, Thursdays, and Ayyam al-Bidh White Days).
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[...getUpcomingSunnahDays(), ...getWhiteDays()]
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 4)
                .map((opp, idx) => {
                  const oppDateStr = toLocalDateString(opp.date);
                  const logForDay = logs.find(l => {
                    const logDateStr = new Date(l.date).toLocaleDateString('en-CA');
                    return logDateStr === oppDateStr;
                  });

                  return (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between gap-3 hover:shadow-sm transition-all"
                    >
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          opp.type === 'white_days' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {opp.type === 'white_days' ? 'White Day' : 'Sunnah'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">{opp.label}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opp.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between gap-2">
                        {logForDay ? (
                          <div className="flex justify-between items-center w-full">
                            {getStatusBadge(logForDay.status)}
                            {logForDay.status === 'intended' && (
                              <Button 
                                size="xs" 
                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md"
                                onClick={() => handleQuickLog(oppDateStr, opp.type, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-1.5 w-full">
                            <Button 
                              variant="outline" 
                              size="xs" 
                              className="h-7 text-[10px] flex-1 border-amber-500/20 text-amber-600 hover:bg-amber-500/10 font-semibold rounded-md"
                              onClick={() => handleQuickLog(oppDateStr, opp.type, 'intended')}
                            >
                              Intend
                            </Button>
                            <Button 
                              size="xs" 
                              className="h-7 text-[10px] flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md"
                              onClick={() => handleQuickLog(oppDateStr, opp.type, 'completed')}
                            >
                              Fasted
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold">Recent Fasting Logs</h2>
            <Button onClick={() => setIsOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Log Fast
            </Button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-sm">
                No fasts logged yet. Click "Log Fast" to begin tracking.
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log._id} className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-900">
                  <div className="flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-center text-amber-600 shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base text-slate-800 dark:text-slate-200">{formatFastType(log.type)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        {log.notes && <p className="text-xs text-slate-400 italic mt-0.5">"{log.notes}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Log Fast Glassmorphic Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl relative">
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            <CardHeader>
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-300">
                Log a Fast
              </CardTitle>
              <p className="text-xs text-slate-400">Record your voluntary or mandatory fasting goals.</p>
            </CardHeader>

            <form onSubmit={handleLogSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="bg-slate-950/50 border-slate-800 text-white focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Fast Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="sunnah_monday" className="bg-slate-900 text-white">Sunnah Monday</option>
                    <option value="sunnah_thursday" className="bg-slate-900 text-white">Sunnah Thursday</option>
                    <option value="white_days" className="bg-slate-900 text-white">Ayyam al-Bidh (White Days)</option>
                    <option value="makeup" className="bg-slate-900 text-white">Qaza (Make-up) Fast</option>
                    <option value="ramadan" className="bg-slate-900 text-white">Ramadan Fast</option>
                    <option value="ashura" className="bg-slate-900 text-white">Ashura Fast</option>
                    <option value="arafah" className="bg-slate-900 text-white">Arafah Fast</option>
                    <option value="nafl" className="bg-slate-900 text-white">Nafl (Voluntary) Fast</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="completed" className="bg-slate-900 text-white">Completed</option>
                    <option value="intended" className="bg-slate-900 text-white">Intended (Fasting Today)</option>
                    <option value="broken" className="bg-slate-900 text-white">Broken</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Notes (Optional)</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Completed with family"
                    className="bg-slate-950/50 border-slate-800 text-white placeholder-slate-700"
                  />
                </div>
              </CardContent>

              <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={logging}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center"
                >
                  {logging ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Log Fast'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
