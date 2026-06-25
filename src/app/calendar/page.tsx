'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';

// Days in month helper
interface CalendarDay {
  gregorianDate: Date;
  isCurrentMonth: boolean;
  hijriDay: string;
  hijriMonth: string;
  hijriYear: string;
}

function getDaysInMonth(year: number, month: number, hijriAdjustment: number): CalendarDay[] {
  const date = new Date(year, month, 1);
  const days: CalendarDay[] = [];

  // Determine the start day of the week (0 = Sunday, ..., 6 = Saturday)
  const startDayOfWeek = date.getDay();

  // Get days from the previous month to fill the first week
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    const h = getHijriDate(d, hijriAdjustment);
    days.push({
      gregorianDate: d,
      isCurrentMonth: false,
      hijriDay: h.day,
      hijriMonth: h.month,
      hijriYear: h.year,
    });
  }

  // Get days of the current month
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    const h = getHijriDate(d, hijriAdjustment);
    days.push({
      gregorianDate: d,
      isCurrentMonth: true,
      hijriDay: h.day,
      hijriMonth: h.month,
      hijriYear: h.year,
    });
  }

  // Get days from the next month to fill the grid (usually 35 or 42 cells)
  const totalTarget = days.length <= 35 ? 35 : 42;
  const currentLen = days.length;
  for (let i = 1; i <= (totalTarget - currentLen); i++) {
    const d = new Date(year, month + 1, i);
    const h = getHijriDate(d, hijriAdjustment);
    days.push({
      gregorianDate: d,
      isCurrentMonth: false,
      hijriDay: h.day,
      hijriMonth: h.month,
      hijriYear: h.year,
    });
  }

  return days;
}

function getHijriDate(date: Date, adjustment: number) {
  const adjusted = new Date(date);
  adjusted.setDate(adjusted.getDate() + adjustment);
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(adjusted);
    let day = '';
    let month = '';
    let year = '';
    parts.forEach(p => {
      if (p.type === 'day') day = p.value;
      else if (p.type === 'month') month = p.value;
      else if (p.type === 'year') year = p.value;
    });
    return { day, month, year };
  } catch (e) {
    return { day: String(date.getDate()), month: 'Unknown', year: '1448' };
  }
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [daysToHajj, setDaysToHajj] = useState(0);
  const [daysToRamadan, setDaysToRamadan] = useState(0);
  const [hijriDateString, setHijriDateString] = useState("Loading Hijri Date...");

  // Navigation states for monthly grid
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  const hijriAdjustment = (session?.user as any)?.hijriAdjustment || 0;

  const [locationStr, setLocationStr] = useState(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        return `${loc.city}, ${loc.country || 'Saudi Arabia'}`;
      }
    }
    return "Makkah, Saudi Arabia";
  });

  useEffect(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        setLocationStr(`${loc.city}, ${loc.country || 'Saudi Arabia'}`);
      }
    }
  }, [session]);

  useEffect(() => {
    // Fetch today's Hijri date
    const today = new Date();
    const h = getHijriDate(today, hijriAdjustment);
    setHijriDateString(`${h.day} ${h.month} ${h.year} AH`);

    // Next Ramadan (Approx Feb 8, 2027)
    // Next Hajj (Approx May 16, 2027)
    const now = new Date();
    const nextRamadan = new Date('2027-02-08');
    const nextHajj = new Date('2027-05-16');

    if (now > nextRamadan) nextRamadan.setFullYear(now.getFullYear() + 1);
    if (now > nextHajj) nextHajj.setFullYear(now.getFullYear() + 1);

    const msPerDay = 1000 * 60 * 60 * 24;
    setDaysToRamadan(Math.ceil((nextRamadan.getTime() - now.getTime()) / msPerDay));
    setDaysToHajj(Math.ceil((nextHajj.getTime() - now.getTime()) / msPerDay));
  }, [session, hijriAdjustment]);

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
      return prev + 1;
    });
  };

  // Generate grid days
  const daysInMonthGrid = getDaysInMonth(currentYear, currentMonth, hijriAdjustment);

  // Calculate corresponding Hijri month names covered in the current grid
  const firstDay = daysInMonthGrid.find(d => d.isCurrentMonth);
  const lastDay = [...daysInMonthGrid].reverse().find(d => d.isCurrentMonth);
  let hijriMonthHeading = '';
  if (firstDay && lastDay) {
    if (firstDay.hijriMonth === lastDay.hijriMonth) {
      hijriMonthHeading = `${firstDay.hijriMonth} ${firstDay.hijriYear} AH`;
    } else {
      hijriMonthHeading = `${firstDay.hijriMonth} - ${lastDay.hijriMonth} ${lastDay.hijriYear} AH`;
    }
  }

  const gregorianHeading = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const todayStr = new Date().toDateString();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-purple-100 dark:border-purple-900/30">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/10 animate-in zoom-in-50 duration-500">
          <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">Islamic Calendar</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" /> {locationStr}
          </p>
        </div>
      </div>

      {/* Large Today Display */}
      <div className="text-center py-6 bg-purple-50/30 dark:bg-purple-950/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 p-8 shadow-sm">
        <h2 className="text-5xl md:text-6xl font-black text-purple-900 dark:text-purple-100 mb-2 leading-none tracking-tight">
          {hijriDateString}
        </h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {hijriAdjustment !== 0 && (
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-2 bg-purple-100/50 dark:bg-purple-950/50 px-3 py-1 rounded-full w-fit mx-auto">
            Hijri offset adjustment: {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment} {Math.abs(hijriAdjustment) === 1 ? 'day' : 'days'}
          </p>
        )}
      </div>

      {/* Month Calendar Grid View */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
          <div className="text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Monthly View</CardTitle>
            <CardDescription className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              {hijriMonthHeading}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {gregorianHeading}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Week Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}

            {/* Grid Cells */}
            {daysInMonthGrid.map((day, idx) => {
              const isToday = day.gregorianDate.toDateString() === todayStr;
              const isJummah = day.gregorianDate.getDay() === 5; // Friday

              return (
                <div
                  key={idx}
                  className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all group ${
                    day.isCurrentMonth
                      ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850'
                      : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 opacity-40'
                  } ${
                    isToday
                      ? 'ring-2 ring-purple-600 dark:ring-purple-400 bg-purple-50/30 dark:bg-purple-950/10 border-purple-400'
                      : 'hover:border-purple-400 hover:bg-purple-500/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] sm:text-xs font-bold ${isToday ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-600'}`}>
                      {day.gregorianDate.getDate()}
                    </span>
                    {isJummah && day.isCurrentMonth && (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Jummah
                      </span>
                    )}
                  </div>

                  <div className="text-right mt-2">
                    <span className={`block text-xs sm:text-sm font-black ${
                      isToday 
                        ? 'text-purple-700 dark:text-purple-300' 
                        : day.hijriDay === '1'
                          ? 'text-purple-600 dark:text-purple-400 font-extrabold underline'
                          : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {day.hijriDay}
                    </span>
                    <span className="block text-[8px] text-muted-foreground truncate opacity-70 font-semibold">
                      {day.hijriDay === '1' ? day.hijriMonth.slice(0, 7) : day.hijriMonth.slice(0, 3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <h3 className="text-xl font-bold mb-2">Countdown to Ramadan</h3>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{daysToRamadan}</span>
              <span className="text-xl mb-1 text-amber-100">Days</span>
            </div>
            <p className="mt-4 text-amber-100 text-sm">O Allah, let us reach Ramadan.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <h3 className="text-xl font-bold mb-2">Countdown to Hajj</h3>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{daysToHajj}</span>
              <span className="text-xl mb-1 text-emerald-100">Days</span>
            </div>
            <p className="mt-4 text-emerald-100 text-sm">Labbaik Allahumma Labbaik.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Upcoming Islamic Events</h3>
        <div className="space-y-4">
          {[
            { event: 'Ashura', date: '10 Muharram', details: 'Fasting is highly recommended.' },
            { event: 'Mawlid al-Nabi', date: '12 Rabi al-Awwal', details: 'Observance of the Prophet\'s (ﷺ) birth.' },
            { event: 'Laylat al-Miraj', date: '27 Rajab', details: 'The Night Journey.' },
            { event: 'Laylat al-Bara\'at', date: '15 Sha\'ban', details: 'The Night of Records.' },
            { event: 'Eid al-Fitr', date: '1 Shawwal', details: 'Festival of Breaking the Fast.' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-lg">{item.event}</h4>
                <p className="text-sm text-muted-foreground">{item.details}</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-purple-600 dark:text-purple-400">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
