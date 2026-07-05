const CACHE_NAME = 'nur-e-qalbb-v1';

// Add core assets to cache
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for a dynamic app
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  // Skip API routes so they don't get permanently cached and break the app
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
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
          icon: icon || '/icons/icon-192x192.png',
          badge: badge || '/icons/icon-192x192.png',
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
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
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
          self.clients.matchAll().then(clients => {
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
