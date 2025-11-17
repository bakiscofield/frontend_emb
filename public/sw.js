// Service Worker EMB avec fonctionnalités PWA avancées
const CACHE_NAME = 'emb-v2';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/admin/login',
  '/admin/dashboard',
  '/manifest.json',
  OFFLINE_URL
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache ouvert');
      return cache.addAll(urlsToCache);
    })
  );

  // Force le nouveau SW à devenir actif immédiatement
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// Stratégie de cache : Network First avec fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si succès, mettre en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, utiliser le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si page de navigation, retourner offline.html
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background Sync - Synchroniser données quand connexion revient
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncTransactions());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'EMB';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'emb-notification',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si fenêtre ouverte, la focus
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          // Sinon ouvrir nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Fonction de synchronisation
async function syncTransactions() {
  try {
    console.log('[SW] Synchronisation transactions...');
    // Implémenter logique de sync selon besoins
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Erreur sync:', error);
    return Promise.reject(error);
  }
}
