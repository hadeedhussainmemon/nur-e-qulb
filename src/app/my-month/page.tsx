'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Award, TrendingUp, Clock, CalendarDays, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMonthlyPrayerHistory } from '@/app/actions/prayerActions';

interface MonthDay {
  gregorianDate: Date;
  isCurrentMonth: boolean;
  log?: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    completionPercentage: number;
  };
}

function getDaysForMonthGrid(year: number, month: number, monthLogs: any[]): MonthDay[] {
  const date = new Date(year, month, 1);
  const days: MonthDay[] = [];

  const startDayOfWeek = date.getDay();
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    days.push({
      gregorianDate: d,
      isCurrentMonth: false,
    });
  }

  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    // Format YYYY-MM-DD manually to avoid timezone shift
    const dd = String(i).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    const yyyy = year;
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const log = monthLogs.find((l: any) => l.date === dateStr);
    days.push({
      gregorianDate: d,
      isCurrentMonth: true,
      log,
    });
  }

  const totalTarget = days.length <= 35 ? 35 : 42;
  const currentLen = days.length;
  for (let i = 1; i <= (totalTarget - currentLen); i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      gregorianDate: d,
      isCurrentMonth: false,
    });
  }

  return days;
}

export default function MyMonthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadStats = async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const res = await getMonthlyPrayerHistory(year, month);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setStats(res.data.stats || null);
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load monthly statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadStats(currentYear, currentMonth);
    }
  }, [status, currentYear, currentMonth]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Authenticating user session...</p>
      </div>
    );
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev - 1; // Wait, increment is + 1!
    });
  };

  const handleNextMonthCorrect = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthHeading = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const daysGrid = getDaysForMonthGrid(currentYear, currentMonth, logs);
  const todayStr = new Date().toDateString();

  // Helper to choose color dot based on prayer status
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 shadow-sm shadow-emerald-500/20';
      case 'excused':
        return 'bg-pink-400 shadow-sm shadow-pink-400/20';
      case 'qaza':
      case 'missed':
        return 'bg-rose-500 shadow-sm shadow-rose-500/20';
      default:
        return 'bg-slate-200 dark:bg-slate-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 border-b border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Calendar className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              My Month
            </h1>
            <p className="text-muted-foreground text-sm">Visualize your daily prayers, review completion trends, and check historical records.</p>
          </div>
        </div>

        {/* Month Picker Controls */}
        <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-850 self-start md:self-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </Button>
          <span className="font-extrabold text-xs tracking-wide uppercase px-2 text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
            {monthHeading}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonthCorrect}
            className="h-8 w-8 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 animate-pulse">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading stats and logged prayers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Status Grid Column (Takes 2 grid columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950/20">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-base flex items-center gap-2 text-slate-850 dark:text-slate-200">
                  <CalendarDays className="w-5 h-5 text-indigo-500" /> Prayer Completion Grid
                </CardTitle>
                <CardDescription>Visual tracker showing status of all 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-7 gap-2">
                  {/* Weekday headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}

                  {/* Day cells */}
                  {daysGrid.map((day, idx) => {
                    const isToday = day.gregorianDate.toDateString() === todayStr;
                    const log = day.log;
                    const pct = log ? log.completionPercentage : 0;
                    
                    return (
                      <div
                        key={idx}
                        className={`min-h-[64px] p-2 rounded-lg border flex flex-col justify-between transition-all relative group ${
                          day.isCurrentMonth
                            ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850'
                            : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 opacity-30 pointer-events-none'
                        } ${
                          isToday
                            ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-300'
                            : 'hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                        }`}
                      >
                        <span className={`text-[10px] font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {day.gregorianDate.getDate()}
                        </span>

                        {day.isCurrentMonth && (
                          <div className="flex gap-0.5 justify-center mt-2.5">
                            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                              const pStatus = log ? log[p as keyof typeof log] : 'pending';
                              return (
                                <div
                                  key={p}
                                  className={`w-1.5 h-1.5 rounded-full ${getStatusDot(String(pStatus))}`}
                                  title={`${p.toUpperCase()}: ${pStatus}`}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Tooltip on Hover */}
                        {day.isCurrentMonth && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-20 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap space-y-0.5 pointer-events-none">
                            <p className="font-extrabold text-slate-300">{day.gregorianDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            <p>Completion: <span className="font-black text-emerald-400">{pct}%</span></p>
                            <p className="text-[8px] text-slate-400">F: {log?.fajr || 'pending'} • D: {log?.dhuhr || 'pending'} • A: {log?.asr || 'pending'} • M: {log?.maghrib || 'pending'} • I: {log?.isha || 'pending'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend Indicators */}
                <div className="flex flex-wrap gap-4 justify-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Missed / Qaza</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <span>Excused</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <span>Unlogged / Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Column */}
          <div className="space-y-6">
            {/* Completion Percentage ring card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500 animate-bounce" /> Monthly Average
                </CardTitle>
                <CardDescription>Your overall prayer completion average this month.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-900 shadow-inner">
                  <div className="text-center">
                    <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{stats ? stats.averageCompletion : 0}%</span>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Completion</p>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 mt-6 text-center text-xs pt-4 border-t border-slate-100 dark:border-slate-900">
                  <div>
                    <span className="block text-slate-500 font-semibold">Logged Days</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">{stats ? stats.daysLogged : 0} Days</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-semibold">Total Days</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">{stats ? stats.totalDays : 30} Days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual prayers completed card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> Prayer Breakdown
                </CardTitle>
                <CardDescription>Completed times for each individual prayer this month.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {stats && Object.entries(stats.prayers).map(([key, details]: any) => {
                  const maxVal = Math.max(stats.daysLogged, 1);
                  const percentage = Math.round((details.completed / maxVal) * 100);
                  
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-350">
                        <span>{key}</span>
                        <span>{details.completed} / {stats.daysLogged} days</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Historical Month Comparison Chart */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Historical Comparison
                </CardTitle>
                <CardDescription>Prayer completion rates compared over the past 6 months.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-44 flex items-end gap-3 justify-between px-2">
                  {history.map((h, idx) => {
                    const barHeight = Math.max(5, h.percentage);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                        {/* Hover value label */}
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1">
                          {h.percentage}%
                        </span>
                        {/* Vertical Bar */}
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md hover:brightness-110 transition-all duration-500 relative" 
                          style={{ height: `${barHeight}%` }}
                        >
                          {/* Inner glowing glow */}
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* Month abbreviation */}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                          {h.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
