// Service Worker PWA - EMB
// Utilise Workbox via next-pwa pour une gestion optimale du cache

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Prendre immédiatement le contrôle des clients
clientsClaim();

// Version du service worker
const CACHE_VERSION = 'emb-v1.3.0';

// Précacher tous les assets générés automatiquement par next-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// ==================== INSTALLATION ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v' + CACHE_VERSION);
  // Forcer l'activation immédiate du nouveau service worker
  self.skipWaiting();
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
            .filter((name) => name.startsWith('emb-') && !name.includes(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Prendre le contrôle de tous les clients
      self.clients.claim()
    ]).then(() => {
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

// ==================== ROUTES PERSONNALISÉES ====================

// Route pour config.json - toujours récupérer la version fraîche
registerRoute(
  ({ url }) => url.pathname === '/config.json',
  new NetworkFirst({
    cacheName: 'config-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// Route pour les images - Cache First pour performance
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
      })
    ]
  })
);

// Route pour les API externes - Network First avec fallback
registerRoute(
  ({ url }) => url.origin !== self.location.origin && url.pathname.includes('/api/'),
  new NetworkFirst({
    cacheName: 'external-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// ==================== NOTIFICATIONS PUSH ====================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification reçue:', event);

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
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : defaultOptions.requireInteraction,
        actions: defaultOptions.actions,
        tag: data.tag || 'emb-notification',
        renotify: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[SW] Erreur parsing notification:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Ouvrir ou focus la fenêtre de l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre si aucune n'existe
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/dashboard';
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée');
  // Analytics ou tracking si nécessaire
});

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

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

    // Récupérer les transactions en attente depuis IndexedDB ou localStorage
    // et les envoyer au serveur

    // Exemple: envoyer les données au serveur
    // const response = await fetch('/api/sync-transactions', {
    //   method: 'POST',
    //   body: JSON.stringify(pendingTransactions)
    // });

    console.log('[SW] Synchronisation des transactions terminée');
  } catch (error) {
    console.error('[SW] Erreur sync transactions:', error);
    throw error; // Relancer l'erreur pour réessayer plus tard
  }
}

async function syncPendingData() {
  try {
    console.log('[SW] Synchronisation des données en attente...');
    // Logique de synchronisation des données
  } catch (error) {
    console.error('[SW] Erreur sync données:', error);
    throw error;
  }
}

// ==================== PERIODIC BACKGROUND SYNC ====================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync:', event.tag);

  if (event.tag === 'content-sync') {
    event.waitUntil(periodicContentSync());
  }
});

async function periodicContentSync() {
  try {
    console.log('[SW] Synchronisation périodique du contenu...');

    // Mettre à jour le cache des données critiques
    const criticalUrls = [
      '/config.json',
      '/api/exchange-pairs',
      '/api/system-status'
    ];

    const cache = await caches.open('periodic-sync-cache');

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
  console.log('[SW] Message reçu:', event.data);

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
        // Notifier le client
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Vérification de mise à jour');
    event.waitUntil(
      self.registration.update().then(() => {
        console.log('[SW] Vérification de mise à jour terminée');
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
});

// ==================== GESTION DES ERREURS ====================
self.addEventListener('error', (event) => {
  console.error('[SW] Erreur globale:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Promise rejetée non gérée:', event.reason);
});

console.log('[SW] Service Worker chargé - Version:', CACHE_VERSION);
