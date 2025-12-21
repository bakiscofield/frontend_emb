// Service Worker PWA - EMB (Standalone, sans Workbox)
// Version personnalisée avec gestion complète des notifications push

// Version du service worker
const CACHE_VERSION = 'emb-v2.0.0';
const CACHE_NAMES = {
  static: `emb-static-${CACHE_VERSION}`,
  dynamic: `emb-dynamic-${CACHE_VERSION}`,
  images: `emb-images-${CACHE_VERSION}`,
  api: `emb-api-${CACHE_VERSION}`,
};

// Durées de cache (en secondes)
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60,  // 30 jours
  dynamic: 7 * 24 * 60 * 60,  // 7 jours
  images: 30 * 24 * 60 * 60,  // 30 jours
  api: 5 * 60,                 // 5 minutes
};

// Taille maximale des caches
const MAX_CACHE_SIZE = {
  static: 50,
  dynamic: 100,
  images: 60,
  api: 30,
};

// URLs à précacher
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ==================== INSTALLATION ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Précaching des URLs essentielles');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW] Précache terminé');
        // Forcer l'activation immédiate
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur lors du précache:', error);
      })
  );
});

// ==================== ACTIVATION ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation v' + CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Supprimer les caches qui ne correspondent pas à la version actuelle
              return name.startsWith('emb-') && !Object.values(CACHE_NAMES).includes(name);
            })
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      }),

      // Prendre le contrôle de tous les clients immédiatement
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service Worker activé et en contrôle');

      // Notifier tous les clients
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// ==================== STRATÉGIES DE CACHE ====================

// Helper: Limiter la taille d'un cache
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Supprimer les plus anciennes entrées
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map(key => cache.delete(key)));
    console.log(`[SW] Cache ${cacheName} limité à ${maxItems} entrées`);
  }
}

// Helper: Vérifier l'expiration d'une entrée de cache
function isCacheExpired(cachedResponse, maxAge) {
  if (!cachedResponse) return true;

  const cachedDate = cachedResponse.headers.get('date');
  if (!cachedDate) return false;

  const cacheTime = new Date(cachedDate).getTime();
  const now = Date.now();
  const age = (now - cacheTime) / 1000; // en secondes

  return age > maxAge;
}

// Stratégie: Cache First (pour les assets statiques)
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.static);
    }
    return networkResponse;
  } catch (error) {
    // Si offline et pas de cache, retourner la page offline pour les documents
    if (request.destination === 'document') {
      return cache.match('/offline.html');
    }
    throw error;
  }
}

// Stratégie: Network First (pour les pages et API)
async function networkFirst(request, cacheName, maxAge, timeout = 3000) {
  const cache = await caches.open(cacheName);

  try {
    // Créer une promesse de timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    });

    // Course entre le fetch et le timeout
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback pour les documents
    if (request.destination === 'document') {
      return cache.match('/offline.html');
    }

    throw error;
  }
}

// Stratégie: Stale While Revalidate (pour les images)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch en arrière-plan pour mettre à jour le cache
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.images);
    }
    return networkResponse;
  });

  // Retourner le cache immédiatement s'il existe, sinon attendre le réseau
  return cachedResponse || fetchPromise;
}

// ==================== INTERCEPTION DES REQUÊTES ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes chrome-extension et autres protocoles spéciaux
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Router selon le type de requête
  event.respondWith(
    (async () => {
      try {
        // Images
        if (request.destination === 'image') {
          return await staleWhileRevalidate(request, CACHE_NAMES.images);
        }

        // API externes
        if (url.pathname.startsWith('/api/')) {
          return await networkFirst(request, CACHE_NAMES.api, CACHE_DURATION.api, 5000);
        }

        // Assets statiques (JS, CSS, fonts)
        if (
          request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'font'
        ) {
          return await cacheFirst(request, CACHE_NAMES.static, CACHE_DURATION.static);
        }

        // Documents HTML
        if (request.destination === 'document') {
          return await networkFirst(request, CACHE_NAMES.dynamic, CACHE_DURATION.dynamic);
        }

        // Tout le reste - Network First
        return await networkFirst(request, CACHE_NAMES.dynamic, CACHE_DURATION.dynamic);

      } catch (error) {
        console.error('[SW] Erreur lors du fetch:', error);

        // Fallback offline pour les documents
        if (request.destination === 'document') {
          const cache = await caches.open(CACHE_NAMES.static);
          return cache.match('/offline.html');
        }

        return new Response('Service Worker: Erreur réseau', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// ==================== NOTIFICATIONS PUSH ====================
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push notification reçue:', event);

  const defaultOptions = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  let notificationData = {
    title: 'EMB - Échange Mobile Banking',
    body: 'Nouvelle notification',
    ...defaultOptions
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || defaultOptions.icon,
        badge: data.badge || defaultOptions.badge,
        data: data,
        vibrate: defaultOptions.vibrate,
        requireInteraction: data.requireInteraction !== undefined
          ? data.requireInteraction
          : defaultOptions.requireInteraction,
        actions: defaultOptions.actions,
        tag: data.tag || 'emb-notification',
        renotify: true,
        timestamp: Date.now()
      };

      console.log('[SW] 📧 Notification préparée:', notificationData.title);
    } catch (error) {
      console.error('[SW] ❌ Erreur parsing notification:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('[SW] ✅ Notification affichée avec succès');
      })
      .catch((error) => {
        console.error('[SW] ❌ Erreur affichage notification:', error);
      })
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notification cliquée:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    console.log('[SW] Action: Fermer la notification');
    return;
  }

  // Ouvrir ou focus la fenêtre de l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Clients ouverts:', clientList.length);

        // Chercher une fenêtre déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('[SW] Focus sur la fenêtre existante');
            return client.focus();
          }
        }

        // Ouvrir une nouvelle fenêtre si aucune n'existe
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/dashboard';
          console.log('[SW] Ouverture nouvelle fenêtre:', url);
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de l\'ouverture:', error);
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée');
  // Analytics ou tracking si nécessaire
});

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }

  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncTransactions() {
  try {
    console.log('[SW] Synchronisation des transactions en arrière-plan...');
    // Logique de synchronisation à implémenter
    console.log('[SW] Synchronisation des transactions terminée');
  } catch (error) {
    console.error('[SW] Erreur sync transactions:', error);
    throw error;
  }
}

async function syncPendingData() {
  try {
    console.log('[SW] Synchronisation des données en attente...');
    // Logique de synchronisation à implémenter
    console.log('[SW] Synchronisation terminée');
  } catch (error) {
    console.error('[SW] Erreur sync données:', error);
    throw error;
  }
}

// ==================== PERIODIC BACKGROUND SYNC ====================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] 🔄 Periodic background sync:', event.tag);

  if (event.tag === 'content-sync') {
    event.waitUntil(periodicContentSync());
  }
});

async function periodicContentSync() {
  try {
    console.log('[SW] Synchronisation périodique du contenu...');

    const criticalUrls = [
      '/api/exchange-pairs',
      '/api/system-status'
    ];

    const cache = await caches.open(CACHE_NAMES.api);

    await Promise.all(
      criticalUrls.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(url, response.clone());
            console.log('[SW] Mis à jour:', url);
          }
        } catch (error) {
          console.error('[SW] Erreur mise à jour:', url, error);
        }
      })
    );

    console.log('[SW] Synchronisation périodique terminée');
  } catch (error) {
    console.error('[SW] Erreur sync périodique:', error);
  }
}

// ==================== MESSAGES ====================
self.addEventListener('message', (event) => {
  console.log('[SW] 💬 Message reçu:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting demandé');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Nettoyage de tous les caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Suppression cache:', name);
            return caches.delete(name);
          })
        );
      }).then(() => {
        console.log('[SW] Tous les caches ont été supprimés');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Vérification de mise à jour');
    event.waitUntil(
      self.registration.update().then(() => {
        console.log('[SW] Vérification de mise à jour terminée');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
});

// ==================== GESTION DES ERREURS ====================
self.addEventListener('error', (event) => {
  console.error('[SW] ⚠️ Erreur globale:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] ⚠️ Promise rejetée non gérée:', event.reason);
});

console.log('[SW] 🚀 Service Worker chargé - Version:', CACHE_VERSION);
