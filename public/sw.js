const CACHE_NAME = 'nur-e-qulb-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic Cache Strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude API routes, next-auth, next static compilation assets, and local development tools
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/_next/') || 
    url.pathname.includes('/auth/') ||
    url.hostname.includes('vercel.live')
  ) {
    return;
  }

  // 1. Cache-First Strategy for Quran, Hadith, and Audio Assets
  const isCacheFirstOrigin = 
    url.hostname === 'api.alquran.cloud' || 
    url.hostname === 'cdn.jsdelivr.net' || 
    url.hostname === 'api.aladhan.com' ||
    url.hostname === 'everyayah.com';

  if (isCacheFirstOrigin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response(JSON.stringify({ error: 'Offline fallback content not available' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }

  // 2. Network-First Strategy with Cache Fallback for Local Pages
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Handle background Web Push events
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const { title, body, icon, badge, actions, data } = payload;
      
      event.waitUntil(
        self.registration.showNotification(title, {
          body: body || 'You have a reminder from Nur-e-Qulb.',
          icon: icon || '/logo.png',
          badge: badge || '/logo.png',
          actions: actions || [],
          data: data || {},
          requireInteraction: true
        })
      );
    } catch (e) {
      // Fallback if data is not JSON
      event.waitUntil(
        self.registration.showNotification('Nur-e-Qulb Reminder', {
          body: event.data.text(),
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true
        })
      );
    }
  }
});

// Handle interactive notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'prayed' && event.notification.data) {
    const { prayer, date } = event.notification.data;
    
    // Fire the POST request to our endpoint in the background
    event.waitUntil(
      fetch('/api/prayers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, prayer, status: 'completed' })
      }).then(res => res.json())
      .then(data => {
        if (data.success) {
          // Tell all open clients to refresh their UI
          self.clients.matchAll().then((clients) => {
            clients.forEach(client => {
              client.postMessage({ type: 'PRAYER_LOGGED', prayer, date });
            });
          });
        }
      })
      .catch(err => console.error('SW fetch failed logging prayer:', err))
    );
  } else {
    // Standard card body click: navigate to URL
    const urlToOpen = (event.notification.data && event.notification.data.url)
      ? event.notification.data.url
      : '/';

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Check if there is already a window tab open, focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          const clientPath = new URL(client.url).pathname;
          if (clientPath === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
