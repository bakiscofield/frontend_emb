// Service Worker EMB avec fonctionnalités PWA avancées
const CACHE_VERSION = 'v3';
const CACHE_NAME = `emb-${CACHE_VERSION}`;
const CACHE_STATIC = `emb-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `emb-dynamic-${CACHE_VERSION}`;
const CACHE_IMAGES = `emb-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Ressources essentielles à mettre en cache immédiatement
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/admin/login',
  '/admin/dashboard',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  OFFLINE_URL
];

// Durées de cache (en secondes)
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60, // 30 jours pour les ressources statiques
  dynamic: 7 * 24 * 60 * 60, // 7 jours pour le contenu dynamique
  images: 30 * 24 * 60 * 60, // 30 jours pour les images
};

// Taille maximale des caches
const MAX_CACHE_SIZE = {
  static: 50,
  dynamic: 100,
  images: 60,
};

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

  const currentCaches = [CACHE_NAME, CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
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

// Helpers pour la gestion du cache
function getCacheName(request) {
  const url = new URL(request.url);

  // Ressources statiques (JS, CSS, fonts)
  if (/\.(js|css|woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
    return CACHE_STATIC;
  }

  // Images
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)) {
    return CACHE_IMAGES;
  }

  // Contenu dynamique
  return CACHE_DYNAMIC;
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname);
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Supprimer les plus anciennes entrées
    const toDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

// Stratégies de cache intelligentes
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions et autres protocoles
  if (!event.request.url.startsWith('http')) return;

  // Pour les ressources statiques: Cache First (plus rapide)
  if (isStaticAsset(event.request)) {
    event.respondWith(cacheFirst(event.request));
  }
  // Pour les pages HTML et API: Network First (données fraîches)
  else {
    event.respondWith(networkFirst(event.request));
  }
});

// Stratégie Cache First (pour ressources statiques)
async function cacheFirst(request) {
  const cacheName = getCacheName(request);
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Vérifier si le cache est expiré
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const cacheAge = (now - cachedDate) / 1000;

    const maxAge = cacheName === CACHE_IMAGES ? CACHE_DURATION.images : CACHE_DURATION.static;

    if (cacheAge < maxAge) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());

      // Limiter la taille du cache
      limitCacheSize(cacheName,
        cacheName === CACHE_IMAGES ? MAX_CACHE_SIZE.images : MAX_CACHE_SIZE.static
      );
    }

    return networkResponse;
  } catch (error) {
    // Fallback vers le cache même expiré
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Stratégie Network First (pour pages et API)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, networkResponse.clone());

      // Limiter la taille du cache
      limitCacheSize(CACHE_DYNAMIC, MAX_CACHE_SIZE.dynamic);
    }

    return networkResponse;
  } catch (error) {
    // Fallback vers le cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si page de navigation, retourner offline.html
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

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
