'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { savePushSubscription } from '@/app/actions/pushSubscriptionActions';

function urlBase64ToUint8Array(base64String: string) {
  const cleanKey = base64String.replace(/^["']|["']$/g, '');
  const padding = '='.repeat((4 - (cleanKey.length % 4)) % 4);
  const base64 = (cleanKey + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function WazeefahReminderEngine() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    async function initWebPush() {
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();

          if (!sub) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
              console.warn('VAPID public key environment variable is not defined.');
              return;
            }

            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
          }

          await savePushSubscription(JSON.parse(JSON.stringify(sub)));
        } catch (error) {
          console.error('Error setting up Web Push subscription:', error);
        }
      }
    }

    initWebPush();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', initWebPush);
      return () => window.removeEventListener('focus', initWebPush);
    }
  }, [session]);

  return null;
}
