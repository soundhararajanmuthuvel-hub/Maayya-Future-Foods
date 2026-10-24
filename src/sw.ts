/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Cleanup old caches
cleanupOutdatedCaches();

// Precaching application shell & static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Message handler for immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event listener
self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    data = {
      title: 'Maayya Future Foods Alert',
      body: event.data ? event.data.text() : 'Operational notification received.',
    };
  }

  const title = data.title || 'Maayya Future Foods';
  const options = {
    body: data.body || 'Smart Business Manager operational update.',
    icon: '/pwa-192x192.png',
    badge: '/apple-touch-icon.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    tag: data.tag || 'maayya-business-alert',
  };

  event.waitUntil(self.registration.showNotification(title, options as any));
});

// Notification click event listener
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
