import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PushSubscription } from '@/models/PushSubscription';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { UserWazeefah } from '@/models/UserWazeefah';
import { PrayerTimeCache } from '@/models/PrayerTimeCache';
import webpush from 'web-push';

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
    const subscriptions = await PushSubscription.find()
      .populate({
        path: 'userId',
        model: User,
        populate: {
          path: 'settingsId',
          model: Settings
        }
      });

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // 3. Group subscriptions by location & prayer preferences to minimize API fetches
    const groups: Record<string, {
      city: string;
      country: string;
      method: number;
      school: number;
      subs: any[];
    }> = {};

    for (const sub of subscriptions) {
      if (!sub.userId) continue;
      const user = sub.userId as any;
      if (!user.location?.city || !user.location?.country) continue;

      const city = user.location.city.trim();
      const country = user.location.country.trim();
      
      const settings = user.settingsId as any;
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
      } as any)) as any;

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
          )) as any;
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
        if (timingsMap[prayer] === localTimeStr) {
          triggeredPrayer = prayer;
          break;
        }
      }

      // Check for generic time-of-day wazeefah triggers
      let triggeredGenericTime: string | null = null;
      if (localTimeStr === '08:00') triggeredGenericTime = 'Morning';
      if (localTimeStr === '17:00') triggeredGenericTime = 'Evening';
      if (localTimeStr === '22:00') triggeredGenericTime = 'Before Sleep';

      // Get local weekday number (0-6)
      const weekdayStr = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
      const localDayOfWeek = DAYS_MAP[weekdayStr] !== undefined ? DAYS_MAP[weekdayStr] : now.getDay();

      // Dispatch notifications to group subscribers
      for (const sub of subs) {
        const user = sub.userId as any;
        const userSettings = user.settingsId as any;

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
          } catch (err: any) {
            // Clean up invalid/expired subscriptions
            if (err.statusCode === 410 || err.statusCode === 404) {
              await PushSubscription.deleteOne({ _id: sub._id });
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
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await PushSubscription.deleteOne({ _id: sub._id });
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
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await PushSubscription.deleteOne({ _id: sub._id });
                }
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
  } catch (error: any) {
    console.error('Error running cron check-reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
