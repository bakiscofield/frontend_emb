// Service Worker PWA complet - EMB
// Version augmentée pour éviter les rafraîchissements et améliorer le cache
// Service Worker TOUJOURS ACTIF avec gestion automatique
const CACHE_VERSION = 'emb-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Workbox precache manifest - sera remplacé par next-pwa lors du build
const WB_MANIFEST = self.__WB_MANIFEST || [];

// Assets à précacher (essentiels pour le fonctionnement offline)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/config.json',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Ajouter les assets générés par Workbox
  ...WB_MANIFEST.map(entry => typeof entry === 'string' ? entry : entry.url)
];

// Durées de cache (en secondes)
const CACHE_DURATION = {
  short: 5 * 60,       // 5 minutes - pour les données dynamiques
  medium: 30 * 60,     // 30 minutes - pour les pages HTML
  long: 24 * 60 * 60,  // 24 heures - pour les assets statiques
};

// ==================== INSTALLATION ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Précaching des assets essentiels');
        return cache.addAll(PRECACHE_URLS).catch((error) => {
          console.error('[SW] Erreur précache:', error);
          // Continuer même en cas d'erreur pour ne pas bloquer l'installation
        });
      })
      .then(() => {
        console.log('[SW] Installation terminée - Activation automatique');
        // Forcer l'activation immédiate du nouveau service worker
        return self.skipWaiting();
      })
  );
});

// ==================== ACTIVATION ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation v' + CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Supprimer les anciens caches
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('emb-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activé et prend le contrôle de toutes les pages');
        return self.clients.claim();
      })
      .then(() => {
        // Notifier tous les clients que le SW est actif
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

// ==================== FETCH (Stratégies de cache) ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ne pas cacher config.json - toujours récupérer la version fraîche
  if (url.pathname === '/config.json') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => caches.match(request))
    );
    return;
  }

  // Stratégie pour les requêtes API - Network First avec timeout court
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeoutStrategy(request, API_CACHE, 3000));
    return;
  }

  // Stratégie pour les images - Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Stratégie pour les assets statiques (JS, CSS, fonts) - Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Stratégie OPTIMALE pour les pages HTML - Stale-While-Revalidate
  // Sert immédiatement du cache tout en mettant à jour en arrière-plan
  // ÉVITE LES RAFRAÎCHISSEMENTS !
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Par défaut - Stale-While-Revalidate
  event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
});

// ==================== STRATÉGIES DE CACHE ====================

// Network First: Essaie le réseau d'abord, puis le cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    // Mettre en cache seulement les réponses valides
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Si le réseau échoue, chercher dans le cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback vers la page offline pour les pages HTML
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

// Cache First: Cherche dans le cache d'abord, puis le réseau
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Erreur fetch:', error);
    throw error;
  }
}

// Stale-While-Revalidate: Retourne le cache immédiatement et met à jour en arrière-plan
// MEILLEURE STRATÉGIE POUR ÉVITER LES RAFRAÎCHISSEMENTS
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);

  // Promesse de mise à jour en arrière-plan
  const fetchPromise = fetch(request).then((response) => {
    // Mettre à jour le cache en arrière-plan uniquement si succès
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('[SW] Erreur fetch background:', error);
    return null;
  });

  // Retourner immédiatement le cache s'il existe, sinon attendre le réseau
  return cachedResponse || fetchPromise || caches.match('/offline.html');
}

// Network First avec timeout: Essaie le réseau avec un timeout, puis le cache
async function networkFirstWithTimeoutStrategy(request, cacheName, timeout = 3000) {
  try {
    // Créer une promesse avec timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    const fetchPromise = fetch(request);

    // Course entre fetch et timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    // Mettre en cache seulement les réponses valides
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Si timeout ou erreur réseau, chercher dans le cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Utilisation du cache suite à timeout/erreur');
      return cachedResponse;
    }

    // Fallback vers la page offline pour les documents
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

// ==================== NOTIFICATIONS PUSH ====================
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu:', event);

  const defaultOptions = {
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  let notificationData = {
    title: 'EMB Transfer',
    body: 'Nouvelle notification',
    ...defaultOptions
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'EMB Transfer',
        body: data.message || data.body || 'Nouvelle notification',
        icon: data.icon || defaultOptions.icon,
        badge: data.badge || defaultOptions.badge,
        data: data,
        vibrate: defaultOptions.vibrate,
        requireInteraction: defaultOptions.requireInteraction,
        actions: defaultOptions.actions,
        tag: data.tag || 'emb-notification',
        renotify: true
      };
    } catch (e) {
      console.error('[SW] Erreur parsing notification:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre ouverte et la focus
        for (const client of clientList) {
          if (client.url.indexOf(self.location.origin) >= 0 && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event);
});

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  try {
    // Synchroniser les données en attente
    console.log('[SW] Synchronisation des transactions...');
    // Implémenter la logique de synchronisation ici
  } catch (error) {
    console.error('[SW] Erreur sync:', error);
  }
}

// ==================== PERIODIC BACKGROUND SYNC ====================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'content-sync') {
    event.waitUntil(periodicContentSync());
  }
});

async function periodicContentSync() {
  try {
    console.log('[SW] Synchronisation périodique du contenu...');
    // Cette fonction s'exécute périodiquement pour maintenir le SW actif
    // et synchroniser les données en arrière-plan

    // Vérifier et mettre à jour les caches critiques
    const cache = await caches.open(STATIC_CACHE);
    const cachedUrls = await cache.keys();

    console.log('[SW] Contenu en cache:', cachedUrls.length, 'éléments');
  } catch (error) {
    console.error('[SW] Erreur sync périodique:', error);
  }
}

// ==================== MESSAGE ====================
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Forcer la vérification de mise à jour
    event.waitUntil(
      self.registration.update().then(() => {
        console.log('[SW] Vérification de mise à jour effectuée');
      })
    );
  }
});
