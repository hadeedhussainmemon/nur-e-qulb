'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchRandomAyah } from '@/app/actions/quranActions';
import { fetchRandomHadith } from '@/app/actions/hadithActions';

interface UserWazeefahData {
  _id: string;
  title: string;
  description?: string;
  targetCount: number;
  reminderTime?: string;
  isActive: boolean;
}

export function WazeefahReminderEngine() {
  const { data: session } = useSession();
  const [wazeefahs, setWazeefahs] = useState<UserWazeefahData[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<any>({});
  const [settings, setSettings] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ city: string; country: string }>({
    city: 'Makkah',
    country: 'Saudi Arabia',
  });

  const [notifiedToday, setNotifiedToday] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nureqalbb_notified_today');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        console.error('Failed to parse notifiedToday from localStorage:', e);
      }
    }
    return {};
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nureqalbb_notified_today', JSON.stringify(notifiedToday));
      } catch (e) {
        console.error('Failed to save notifiedToday to localStorage:', e);
      }
    }
  }, [notifiedToday]);

  // Check existing notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // We already have permission
      }
    }
  }, []);

  const [todayLog, setTodayLog] = useState<any>(null);

  // Fetch user's scheduled wazeefahs, profile, settings and prayer times via API route
  useEffect(() => {
    if (!session?.user?.email) return;

    async function initializeEngine() {
      try {
        const todayDateStr = new Date().toLocaleDateString('en-CA');
        const res = await fetch('/api/wazeefahs/reminders?date=' + todayDateStr);
        if (!res.ok) throw new Error('Failed to fetch reminders configuration');
        const data = await res.json();

        setWazeefahs(data.wazeefahs || []);
        setUserLocation(data.location || { city: 'Makkah', country: 'Saudi Arabia' });
        setSettings(data.settings);
        setPrayerTimes(data.prayerTimes || {});
        if (data.todayLog) setTodayLog(data.todayLog);
      } catch (err) {
        console.error('Failed to initialize Wazeefah Reminder Engine:', err);
      }
    }

    initializeEngine();

    // Re-initialize every 30 minutes to update logs/times/settings
    const interval = setInterval(initializeEngine, 1800000);
    
    // Listen for Service Worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PRAYER_LOGGED') {
        setTodayLog((prev: any) => {
          if (!prev) return prev;
          return { ...prev, [event.data.prayer]: 'completed' };
        });
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [session]);

  const cleanTimeStr = (rawStr: string): string => {
    if (!rawStr) return '';
    const match = rawStr.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : rawStr.trim();
  };

  const triggerBrowserNotification = async (title: string, body: string, actions?: any[], data?: any) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && actions) {
        try {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body,
            icon: '/manifest.json',
            badge: '/manifest.json',
            actions,
            data,
            requireInteraction: true
          } as any);
          return;
        } catch (e) {
          console.error('SW notification failed, falling back to basic notification', e);
        }
      }
      
      // Fallback for basic notifications
      new Notification(title, {
        body,
        icon: '/manifest.json',
        badge: '/manifest.json',
      });
    }
  };

  // Clock checking loop (runs every 30 seconds)
  useEffect(() => {
    // If we don't have prayer times yet, hold off
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMin = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMin}`; // e.g. "05:15"
      const todayDateStr = now.toLocaleDateString('en-CA'); // "YYYY-MM-DD"

      // 1. Prune old keys to keep localStorage clean
      const cleaned: Record<string, string> = {};
      let hasChanges = false;
      Object.entries(notifiedToday).forEach(([k, v]) => {
        if (v === todayDateStr) {
          cleaned[k] = v;
        } else {
          hasChanges = true;
        }
      });
      if (hasChanges) {
        setNotifiedToday(cleaned);
        return; // wait for next interval to check triggers
      }

      // Check notification preferences (default to true except Ramadan)
      const showPrayerAlerts = settings ? settings.notifications?.prayerReminders !== false : true;
      const showDailyAyah = settings ? settings.notifications?.dailyAyah !== false : true;
      const showDailyHadith = settings ? settings.notifications?.dailyHadith !== false : true;
      const showFridayReminders = settings ? settings.notifications?.fridayReminders !== false : true;
      const showRamadanReminders = settings ? settings.notifications?.ramadanReminders === true : false;

      // 2. Process Wazeefah Reminders
      wazeefahs.forEach((uw) => {
        if (notifiedToday[uw._id] === todayDateStr) return;

        let targetTimeStr: string | null = null;
        const reminder = uw.reminderTime || 'Fajr';

        if (['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(reminder)) {
          targetTimeStr = cleanTimeStr(prayerTimes[reminder] || null);
        } else if (reminder === 'Morning') {
          targetTimeStr = '08:00';
        } else if (reminder === 'Evening') {
          targetTimeStr = '17:00';
        } else if (reminder === 'Before Sleep') {
          targetTimeStr = '21:30';
        }

        if (targetTimeStr && targetTimeStr === currentTimeStr) {
          triggerBrowserNotification(
            `Time for your Wazeefah`,
            `"${uw.title}" • Target: ${uw.targetCount} times\n${uw.description || ''}`
          );
          setNotifiedToday((prev) => ({ ...prev, [uw._id]: todayDateStr }));
        }
      });

      // 3. Process Adhan / Prayer Time Alerts
      if (showPrayerAlerts) {
        const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        
        mainPrayers.forEach((pName, index) => {
          const rawTime = prayerTimes[pName];
          if (!rawTime) return;
          const targetTimeStr = cleanTimeStr(rawTime);
          const [startH, startM] = targetTimeStr.split(':').map(Number);
          const startTotalMins = startH * 60 + startM;
          
          // Determine end time
          let endTotalMins = 0;
          if (pName === 'Isha') {
            const fajrRaw = prayerTimes['Fajr'];
            if (fajrRaw) {
              const [fh, fm] = cleanTimeStr(fajrRaw).split(':').map(Number);
              endTotalMins = (fh + 24) * 60 + fm; // Next day Fajr
            }
          } else {
            const nextPrayer = mainPrayers[index + 1];
            const nextRaw = prayerTimes[nextPrayer];
            if (nextRaw) {
              const [nh, nm] = cleanTimeStr(nextRaw).split(':').map(Number);
              endTotalMins = nh * 60 + nm;
            }
          }

          const currentTotalMins = now.getHours() * 60 + now.getMinutes();
          // Adjust current mins for Isha if we passed midnight
          const adjustedCurrentMins = (pName === 'Isha' && now.getHours() < 12) ? currentTotalMins + 24 * 60 : currentTotalMins;

          const isInsideWindow = adjustedCurrentMins >= startTotalMins && adjustedCurrentMins < endTotalMins;
          const minutesPassed = adjustedCurrentMins - startTotalMins;
          const minutesRemaining = endTotalMins - adjustedCurrentMins;

          const notifyKeyStart = `prayer-${pName}-${todayDateStr}-start`;
          const notifyKeyNag = `prayer-${pName}-${todayDateStr}-nag-${minutesPassed}`;
          const notifyKeyWarn = `prayer-${pName}-${todayDateStr}-warn`;

          const lowerName = pName.toLowerCase();
          const isPending = todayLog && todayLog[lowerName] === 'pending';

          const actions = [
            { action: 'prayed', title: 'Prayed ✅' },
            { action: 'dismiss', title: 'Not Yet ❌' }
          ];
          const data = { prayer: lowerName, date: todayDateStr };

          // 1. Initial Notification
          if (targetTimeStr === currentTimeStr && notifiedToday[notifyKeyStart] !== todayDateStr) {
            triggerBrowserNotification(
              `Salah Time: ${pName}`,
              `It is time for ${pName} prayer in ${userLocation.city}. Adhan starts now.`,
              actions, data
            );
            setNotifiedToday((prev) => ({ ...prev, [notifyKeyStart]: todayDateStr }));
          }

          // 2. Nagging every 30 mins
          if (isInsideWindow && isPending && minutesPassed > 0 && minutesPassed % 30 === 0 && notifiedToday[notifyKeyNag] !== todayDateStr) {
            triggerBrowserNotification(
              `Reminder: ${pName}`,
              `Have you prayed ${pName} yet? It has been ${minutesPassed} minutes since Adhan.`,
              actions, data
            );
            setNotifiedToday((prev) => ({ ...prev, [notifyKeyNag]: todayDateStr }));
          }

          // 3. 10 Minute Warning
          if (isInsideWindow && isPending && minutesRemaining === 10 && notifiedToday[notifyKeyWarn] !== todayDateStr) {
            triggerBrowserNotification(
              `Expiring Soon: ${pName}`,
              `You only have 10 minutes left to pray ${pName}!`,
              actions, data
            );
            setNotifiedToday((prev) => ({ ...prev, [notifyKeyWarn]: todayDateStr }));
          }
        });
      }

      // 4. Process Daily Ayah Reminder (at 09:00 AM)
      if (showDailyAyah) {
        const ayahNotifyKey = `dailyAyah-${todayDateStr}`;
        if (currentTimeStr === '09:00' && notifiedToday[ayahNotifyKey] !== todayDateStr) {
          fetchRandomAyah()
            .then((ayahData) => {
              if (ayahData?.english?.text) {
                triggerBrowserNotification(
                  `Daily Verse`,
                  `"${ayahData.english.text}" — Surah ${ayahData.arabic?.surah?.englishName || ''} (${ayahData.arabic?.surah?.number || ''}:${ayahData.arabic?.numberInSurah || ''})`
                );
              }
            })
            .catch((err) => console.error('Error in Daily Ayah notification:', err));

          setNotifiedToday((prev) => ({ ...prev, [ayahNotifyKey]: todayDateStr }));
        }
      }

      // 5. Process Daily Hadith Reminder (at 03:00 PM / "15:00")
      if (showDailyHadith) {
        const hadithNotifyKey = `dailyHadith-${todayDateStr}`;
        if (currentTimeStr === '15:00' && notifiedToday[hadithNotifyKey] !== todayDateStr) {
          fetchRandomHadith('bukhari')
            .then((hadithData) => {
              if (hadithData?.hadith?.text) {
                let text = hadithData.hadith.text;
                if (text.length > 150) {
                  text = text.substring(0, 147) + '...';
                }
                triggerBrowserNotification(
                  `Daily Hadith (${hadithData.metadata?.name || 'Bukhari'})`,
                  `"${text}"`
                );
              }
            })
            .catch((err) => console.error('Error in Daily Hadith notification:', err));

          setNotifiedToday((prev) => ({ ...prev, [hadithNotifyKey]: todayDateStr }));
        }
      }

      // 6. Process Friday Kahf & Salawat Weekly Reminder (Fridays at 10:00 AM)
      if (showFridayReminders && now.getDay() === 5) {
        const fridayNotifyKey = `fridayKahf-${todayDateStr}`;
        if (currentTimeStr === '10:00' && notifiedToday[fridayNotifyKey] !== todayDateStr) {
          triggerBrowserNotification(
            `Jumu'ah Mubarak`,
            `Don't forget to read Surah Al-Kahf and send blessings (Salawat) upon the Prophet (ﷺ) today.`
          );
          setNotifiedToday((prev) => ({ ...prev, [fridayNotifyKey]: todayDateStr }));
        }
      }

      // 7. Process Ramadan Sehri & Iftar Alerts
      if (showRamadanReminders) {
        // Sehri Countdown Warning (10 mins before Imsak) & Imsak Start
        const rawImsak = prayerTimes['Imsak'];
        if (rawImsak) {
          const cleanImsak = cleanTimeStr(rawImsak);
          const [h, m] = cleanImsak.split(':').map(Number);
          
          if (!isNaN(h) && !isNaN(m)) {
            const imsakDate = new Date();
            imsakDate.setHours(h, m, 0, 0);
            
            const warningDate = new Date(imsakDate.getTime() - 10 * 60 * 1000);
            const warningHour = warningDate.getHours().toString().padStart(2, '0');
            const warningMin = warningDate.getMinutes().toString().padStart(2, '0');
            const warningTimeStr = `${warningHour}:${warningMin}`;

            const warningNotifyKey = `ramadanSehriWarning-${todayDateStr}`;
            if (currentTimeStr === warningTimeStr && notifiedToday[warningNotifyKey] !== todayDateStr) {
              triggerBrowserNotification(
                `Sehri Reminder`,
                `10 minutes remaining for Sehri. Please finish your meal and make your intention to fast.`
              );
              setNotifiedToday((prev) => ({ ...prev, [warningNotifyKey]: todayDateStr }));
            }

            const startNotifyKey = `ramadanSehriStart-${todayDateStr}`;
            if (currentTimeStr === cleanImsak && notifiedToday[startNotifyKey] !== todayDateStr) {
              triggerBrowserNotification(
                `Fasting Begins`,
                `Imsak time reached. Sehri is over. Fasting starts now.`
              );
              setNotifiedToday((prev) => ({ ...prev, [startNotifyKey]: todayDateStr }));
            }
          }
        }

        // Iftar Alert (at Maghrib time)
        const rawMaghrib = prayerTimes['Maghrib'];
        if (rawMaghrib) {
          const cleanMaghrib = cleanTimeStr(rawMaghrib);
          const iftarNotifyKey = `ramadanIftar-${todayDateStr}`;
          if (currentTimeStr === cleanMaghrib && notifiedToday[iftarNotifyKey] !== todayDateStr) {
            triggerBrowserNotification(
              `Iftar Time!`,
              `Maghrib time reached. You can break your fast. May Allah accept your fast and prayers.`
            );
            setNotifiedToday((prev) => ({ ...prev, [iftarNotifyKey]: todayDateStr }));
          }
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [wazeefahs, prayerTimes, notifiedToday, settings, userLocation]);

  return null;
}
