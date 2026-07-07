import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PushSubscription } from '@/models/PushSubscription';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { UserWazeefah } from '@/models/UserWazeefah';
import { PrayerTimeCache } from '@/models/PrayerTimeCache';
import webpush from 'web-push';

type NotificationPayload = {
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: { url: string };
};

type PushKeys = {
  p256dh: string;
  auth: string;
};

type PushSubscriptionPayload = {
  endpoint: string;
  keys: PushKeys;
};

type PushError = {
  statusCode?: number;
};

type SettingsSnapshot = {
  notifications?: {
    prayerReminders?: boolean;
    dailyAyah?: boolean;
    dailyHadith?: boolean;
    fridayReminders?: boolean;
    ramadanReminders?: boolean;
  };
  prayerCalculationMethod?: string;
  madhab?: string;
};

type UserSnapshot = {
  _id: string;
  location?: {
    city?: string;
    country?: string;
  };
  settingsId?: SettingsSnapshot | null;
};

type SubscriptionRow = {
  _id: { toString: () => string };
  userId: UserSnapshot | null;
  subscription: PushSubscriptionPayload;
};

type PrayerCacheRow = {
  dateStr: string;
  timings: Record<string, string>;
  timezone: string;
};

function isPushError(error: unknown): error is PushError {
  return typeof error === 'object' && error !== null && 'statusCode' in error;
}

let webPushInitialized = false;
function initializeWebPush(): boolean {
  if (webPushInitialized) return true;
  
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@nur-e-qulb.com';

  if (!publicKey || !privateKey) {
    console.warn('WebPush VAPID keys are missing from environment variables.');
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    webPushInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to set WebPush VAPID details:', err);
    return false;
  }
}

const METHOD_MAP: Record<string, number> = {
  'Jafari': 0,
  'University of Islamic Sciences, Karachi': 1,
  'ISNA': 2,
  'MWL': 3,
  'Umm Al-Qura': 4,
  'Egyptian': 5,
  'Tehran': 7,
  'Gulf': 8,
  'Kuwait': 9,
  'Qatar': 10,
  'Majlis Ugama Islam Singapura, Singapore': 11,
  'Union Organization Islamique de France': 12,
  'Diyanet İşleri Başkanlığı, Turkey': 13,
  'Spiritual Administration of Muslims of Russia': 14,
  'Moonsighting Committee': 15,
  'Dubai': 16,
};

const DAYS_MAP: Record<string, number> = { 
  'Sun': 0, 
  'Mon': 1, 
  'Tue': 2, 
  'Wed': 3, 
  'Thu': 4, 
  'Fri': 5, 
  'Sat': 6 
};

async function sendPushNotification(subscription: PushSubscriptionPayload, payload: NotificationPayload, subscriptionId: string): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: unknown) {
    if (isPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
      await PushSubscription.deleteOne({ _id: subscriptionId });
      return false;
    }

    throw err;
  }
}

async function fetchRandomAyahPayload() {
  const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
  const [arabicRes, englishRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}`),
    fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.asad`),
  ]);

  if (!arabicRes.ok || !englishRes.ok) {
    throw new Error('Failed to fetch random ayah');
  }

  const arabicData = await arabicRes.json();
  const englishData = await englishRes.json();

  return {
    arabic: arabicData.data,
    english: englishData.data,
  };
}

async function fetchRandomHadithPayload(collection: string = 'bukhari') {
  const res = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${collection}.json`, {
    cache: 'force-cache',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch random hadith');
  }

  const data = await res.json();
  const hadiths = data.hadiths || [];
  if (hadiths.length === 0) {
    throw new Error('No hadiths available');
  }

  const randomIndex = Math.floor(Math.random() * hadiths.length);
  return {
    metadata: data.metadata,
    hadith: hadiths[randomIndex],
  };
}

function timeStringToMinutes(timeStr: string): number | null {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isWithinMinuteWindow(currentMinutes: number, targetMinutes: number, windowSize = 2): boolean {
  const delta = Math.abs(currentMinutes - targetMinutes);
  return Math.min(delta, 1440 - delta) <= windowSize;
}

// Next.js dynamic configuration to bypass static rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Security Check: Verify Vercel Cron authorization header
    const authHeader = req.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Initialize Web Push keys dynamically
    if (!initializeWebPush()) {
      return NextResponse.json({ 
        success: false, 
        message: 'VAPID keys not configured. Skipping check.' 
      });
    }

    // 2. Fetch all registered PWA push subscriptions
    const subscriptions = await PushSubscription.find({})
      .populate({
        path: 'userId',
        model: User,
        populate: {
          path: 'settingsId',
          model: Settings
        }
      }).lean<SubscriptionRow[]>();

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // 3. Group subscriptions by location & prayer preferences to minimize API fetches
    const groups: Record<string, {
      city: string;
      country: string;
      method: number;
      school: number;
      subs: SubscriptionRow[];
    }> = {};

    for (const sub of subscriptions) {
      if (!sub.userId) continue;
      const user = sub.userId;
      if (!user.location?.city || !user.location?.country) continue;

      const city = user.location.city.trim();
      const country = user.location.country.trim();
      
      const settings = user.settingsId;
      const methodStr = settings?.prayerCalculationMethod || '2';
      const method = METHOD_MAP[methodStr] !== undefined ? METHOD_MAP[methodStr] : (parseInt(methodStr) || 2);
      const school = settings?.madhab === 'Hanafi' ? 1 : 0;

      const groupKey = `${city.toLowerCase()}__${country.toLowerCase()}__${method}__${school}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          city,
          country,
          method,
          school,
          subs: []
        };
      }
      groups[groupKey].subs.push(sub);
    }

    let notificationsSent = 0;
    const now = new Date();

    // 4. Process each location group
    for (const groupKey of Object.keys(groups)) {
      const { city, country, method, school, subs } = groups[groupKey];

      // Retrieve local timezone from a cached document first (or default to UTC)
      let cached = (await PrayerTimeCache.findOne({
        city: city.toLowerCase(),
        country: country.toLowerCase(),
        method,
        school
      } as any).lean()) as unknown as PrayerCacheRow | null;

      let timezone = cached ? cached.timezone : 'UTC';

      // Format date in the target timezone
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const localDateStr = dateFormatter.format(now); // "YYYY-MM-DD"

      // Re-fetch prayer times if cache is stale or missing
      if (!cached || cached.dateStr !== localDateStr) {
        try {
          const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`AlAdhan API returned status ${res.status}`);
          
          const apiData = await res.json();
          const timings = apiData.data.timings;
          timezone = apiData.data.meta.timezone;

          cached = (await PrayerTimeCache.findOneAndUpdate(
            { city: city.toLowerCase(), country: country.toLowerCase(), method, school } as any,
            {
              city: city.toLowerCase(),
              country: country.toLowerCase(),
              method,
              school,
              dateStr: localDateStr,
              timings,
              timezone,
              createdAt: new Date()
            },
            { upsert: true, new: true }
          ).lean()) as unknown as PrayerCacheRow | null;
        } catch (err) {
          console.error(`Failed to fetch and cache prayer timings for group ${groupKey}:`, err);
          continue;
        }
      }

      // Convert current time to local timezone format
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      const localTimeStr = timeFormatter.format(now); // "HH:MM"
      const [localHoursStr, localMinutesStr] = localTimeStr.split(':');
      const localHours = parseInt(localHoursStr, 10);
      const localMinutes = parseInt(localMinutesStr, 10);
      const currentTotalMins = localHours * 60 + localMinutes;

      // Clean timings map (strip timezone abbreviations e.g. "05:12 (PKT)" -> "05:12")
      const timingsMap: Record<string, string> = {};
      if (cached && cached.timings) {
        Object.entries(cached.timings).forEach(([pName, pTime]) => {
          if (typeof pTime === 'string') {
            timingsMap[pName] = pTime.split(' ')[0];
          }
        });
      }

      // Check for prayer reminders
      const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      let triggeredPrayer: string | null = null;
      for (const prayer of PRAYERS) {
        const targetTime = timingsMap[prayer];
        const targetMinutes = targetTime ? timeStringToMinutes(targetTime) : null;
        if (targetMinutes !== null && isWithinMinuteWindow(currentTotalMins, targetMinutes, 2)) {
          triggeredPrayer = prayer;
          break;
        }
      }

      // Check for generic time-of-day wazeefah triggers
      let triggeredGenericTime: string | null = null;
      if (isWithinMinuteWindow(currentTotalMins, 8 * 60, 2)) triggeredGenericTime = 'Morning';
      if (isWithinMinuteWindow(currentTotalMins, 17 * 60, 2)) triggeredGenericTime = 'Evening';
      if (isWithinMinuteWindow(currentTotalMins, 22 * 60, 2)) triggeredGenericTime = 'Before Sleep';

      // Get local weekday number (0-6)
      const weekdayStr = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
      const localDayOfWeek = DAYS_MAP[weekdayStr] !== undefined ? DAYS_MAP[weekdayStr] : now.getDay();

      // Dispatch notifications to group subscribers
      for (const sub of subs) {
        const user = sub.userId;
        if (!user) continue;
        const userSettings = user.settingsId;

        // 1. Send Prayer Reminder
        if (triggeredPrayer && userSettings?.notifications?.prayerReminders !== false) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.subscription.endpoint,
                keys: {
                  p256dh: sub.subscription.keys.p256dh,
                  auth: sub.subscription.keys.auth
                }
              },
              JSON.stringify({
                title: `${triggeredPrayer} Prayer Reminder`,
                body: `It is time for the ${triggeredPrayer} prayer in ${city}.`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                data: { url: '/prayers' }
              })
            );
            notificationsSent++;
          } catch (err: unknown) {
            // Clean up invalid/expired subscriptions
            if (isPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
              await PushSubscription.deleteOne({ _id: sub._id as any });
            }
          }
        }

        // 2. Send Prayer-relative Wazeefah Reminder
        if (triggeredPrayer) {
          const userWazeefahs = await UserWazeefah.find({
            userId: user._id,
            isActive: true,
            reminderTime: triggeredPrayer
          });

          for (const uw of userWazeefahs) {
            const days = uw.reminderDays || [0, 1, 2, 3, 4, 5, 6];
            if (days.includes(localDayOfWeek)) {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.subscription.endpoint,
                    keys: {
                      p256dh: sub.subscription.keys.p256dh,
                      auth: sub.subscription.keys.auth
                    }
                  },
                  JSON.stringify({
                    title: `Wazeefah: ${uw.title}`,
                    body: `Time to recite your wazeefah. Target: ${uw.targetCount}x.`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    data: { url: '/wazeefahs' }
                  })
                );
                notificationsSent++;
              } catch (err: unknown) {
                if (isPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
                  await PushSubscription.deleteOne({ _id: sub._id as any });
                }
              }
            }
          }
        }

        // 3. Send generic time-of-day Wazeefah Reminder
        if (triggeredGenericTime) {
          const userWazeefahs = await UserWazeefah.find({
            userId: user._id,
            isActive: true,
            reminderTime: triggeredGenericTime
          });

          for (const uw of userWazeefahs) {
            const days = uw.reminderDays || [0, 1, 2, 3, 4, 5, 6];
            if (days.includes(localDayOfWeek)) {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.subscription.endpoint,
                    keys: {
                      p256dh: sub.subscription.keys.p256dh,
                      auth: sub.subscription.keys.auth
                    }
                  },
                  JSON.stringify({
                    title: `Wazeefah: ${uw.title}`,
                    body: `Time to recite your wazeefah. Target: ${uw.targetCount}x.`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    data: { url: '/wazeefahs' }
                  })
                );
                notificationsSent++;
              } catch (err: unknown) {
                if (isPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
                  await PushSubscription.deleteOne({ _id: sub._id as any });
                }
              }
            }
          }
        }

        const showDailyAyah = userSettings?.notifications?.dailyAyah !== false;
        const showDailyHadith = userSettings?.notifications?.dailyHadith !== false;
        const showFridayReminders = userSettings?.notifications?.fridayReminders !== false;
        const showRamadanReminders = userSettings?.notifications?.ramadanReminders === true;

        // 4. Send daily Ayah reminder in the background
        if (showDailyAyah && localTimeStr === '09:00') {
          try {
            const ayahData = await fetchRandomAyahPayload();
            if (ayahData?.english?.text) {
              const sent = await sendPushNotification(
                {
                  endpoint: sub.subscription.endpoint,
                  keys: {
                    p256dh: sub.subscription.keys.p256dh,
                    auth: sub.subscription.keys.auth
                  }
                },
                {
                  title: 'Daily Verse',
                  body: `"${ayahData.english.text}" — Surah ${ayahData.arabic?.surah?.englishName || ''} (${ayahData.arabic?.surah?.number || ''}:${ayahData.arabic?.numberInSurah || ''})`,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-192x192.png',
                  data: { url: '/quran' }
                },
                sub._id.toString()
              );
              if (sent) notificationsSent++;
            }
          } catch (err) {
            console.error('Failed to send daily ayah push:', err);
          }
        }

        // 5. Send daily Hadith reminder in the background
        if (showDailyHadith && localTimeStr === '15:00') {
          try {
            const hadithData = await fetchRandomHadithPayload('bukhari');
            if (hadithData?.hadith?.text) {
              let text = hadithData.hadith.text;
              if (text.length > 150) {
                text = text.substring(0, 147) + '...';
              }

              const sent = await sendPushNotification(
                {
                  endpoint: sub.subscription.endpoint,
                  keys: {
                    p256dh: sub.subscription.keys.p256dh,
                    auth: sub.subscription.keys.auth
                  }
                },
                {
                  title: `Daily Hadith (${hadithData.metadata?.name || 'Bukhari'})`,
                  body: `"${text}"`,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-192x192.png',
                  data: { url: '/hadith/bukhari' }
                },
                sub._id.toString()
              );
              if (sent) notificationsSent++;
            }
          } catch (err) {
            console.error('Failed to send daily hadith push:', err);
          }
        }

        // 6. Friday reminders in the background
        if (showFridayReminders && localDayOfWeek === 5) {
          if (currentTotalMins >= 600 && currentTotalMins <= 1320) {
            const diffMins = currentTotalMins - 600;
            if (diffMins % 45 === 0) {
              try {
                const sent = await sendPushNotification(
                  {
                    endpoint: sub.subscription.endpoint,
                    keys: {
                      p256dh: sub.subscription.keys.p256dh,
                      auth: sub.subscription.keys.auth
                    }
                  },
                  {
                    title: 'Surah Al-Kahf Reminder',
                    body: `It's Friday! Don't forget to recite Surah Al-Kahf today.`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    data: { url: '/quran' }
                  },
                  sub._id.toString()
                );
                if (sent) notificationsSent++;
              } catch (err) {
                console.error('Failed to send Friday Kahf push:', err);
              }
            }
          }

          if (localHours >= 8 && localHours <= 22 && localMinutes === 0) {
            try {
              const sent = await sendPushNotification(
                {
                  endpoint: sub.subscription.endpoint,
                  keys: {
                    p256dh: sub.subscription.keys.p256dh,
                    auth: sub.subscription.keys.auth
                  }
                },
                {
                  title: 'Salawat Reminder',
                  body: `Send blessings (Salawat) upon the Prophet Muhammad (ﷺ) on this blessed day of Jumu'ah.`,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-192x192.png',
                  data: { url: '/' }
                },
                sub._id.toString()
              );
              if (sent) notificationsSent++;
            } catch (err) {
              console.error('Failed to send Friday salawat push:', err);
            }
          }

          if (localTimeStr === '11:30') {
            try {
              const sent = await sendPushNotification(
                {
                  endpoint: sub.subscription.endpoint,
                  keys: {
                    p256dh: sub.subscription.keys.p256dh,
                    auth: sub.subscription.keys.auth
                  }
                },
                {
                  title: 'Friday Sunnah Reminder',
                  body: `Remember to cut your nails and perform Ghusl before 1 PM Jumu'ah prayer.`,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-192x192.png',
                  data: { url: '/' }
                },
                sub._id.toString()
              );
              if (sent) notificationsSent++;
            } catch (err) {
              console.error('Failed to send Friday nails push:', err);
            }
          }
        }

        // 7. Ramadan reminders in the background
        if (showRamadanReminders) {
          const rawImsak = cached?.timings?.Imsak;
          if (rawImsak) {
            const cleanImsak = String(rawImsak).split(' ')[0];
            const [h, m] = cleanImsak.split(':').map(Number);

            if (!isNaN(h) && !isNaN(m)) {
              const imsakDate = new Date();
              imsakDate.setHours(h, m, 0, 0);

              const warningDate = new Date(imsakDate.getTime() - 10 * 60 * 1000);
              const warningHour = warningDate.getHours().toString().padStart(2, '0');
              const warningMin = warningDate.getMinutes().toString().padStart(2, '0');
              const warningTimeStr = `${warningHour}:${warningMin}`;

              if (localTimeStr === warningTimeStr) {
                try {
                  const sent = await sendPushNotification(
                    {
                      endpoint: sub.subscription.endpoint,
                      keys: {
                        p256dh: sub.subscription.keys.p256dh,
                        auth: sub.subscription.keys.auth
                      }
                    },
                    {
                      title: 'Sehri Reminder',
                      body: `10 minutes remaining for Sehri. Please finish your meal and make your intention to fast.`,
                      icon: '/icons/icon-192x192.png',
                      badge: '/icons/icon-192x192.png',
                      data: { url: '/fasting' }
                    },
                    sub._id.toString()
                  );
                  if (sent) notificationsSent++;
                } catch (err) {
                  console.error('Failed to send Sehri warning push:', err);
                }
              }

              if (localTimeStr === cleanImsak) {
                try {
                  const sent = await sendPushNotification(
                    {
                      endpoint: sub.subscription.endpoint,
                      keys: {
                        p256dh: sub.subscription.keys.p256dh,
                        auth: sub.subscription.keys.auth
                      }
                    },
                    {
                      title: 'Fasting Begins',
                      body: `Imsak time reached. Sehri is over. Fasting starts now.`,
                      icon: '/icons/icon-192x192.png',
                      badge: '/icons/icon-192x192.png',
                      data: { url: '/fasting' }
                    },
                    sub._id.toString()
                  );
                  if (sent) notificationsSent++;
                } catch (err) {
                  console.error('Failed to send Imsak push:', err);
                }
              }
            }
          }

          const rawMaghrib = cached?.timings?.Maghrib;
          if (rawMaghrib) {
            const cleanMaghrib = String(rawMaghrib).split(' ')[0];
            if (localTimeStr === cleanMaghrib) {
              try {
                const sent = await sendPushNotification(
                  {
                    endpoint: sub.subscription.endpoint,
                    keys: {
                      p256dh: sub.subscription.keys.p256dh,
                      auth: sub.subscription.keys.auth
                    }
                  },
                  {
                    title: 'Iftar Time!',
                    body: `Maghrib time reached. You can break your fast. May Allah accept your fast and prayers.`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    data: { url: '/fasting' }
                  },
                  sub._id.toString()
                );
                if (sent) notificationsSent++;
              } catch (err) {
                console.error('Failed to send Iftar push:', err);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Completed checking reminders. Notifications sent: ${notificationsSent}`
    });
  } catch (error: unknown) {
    console.error('Error running cron check-reminders:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
