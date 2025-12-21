// EMB Service Worker - Généré automatiquement
// Ne pas modifier ce fichier directement, éditez worker/index.js

(() => {
  // worker/index.js
  var CACHE_VERSION = "emb-v2.0.0";
  var CACHE_NAMES = {
    static: `emb-static-${CACHE_VERSION}`,
    dynamic: `emb-dynamic-${CACHE_VERSION}`,
    images: `emb-images-${CACHE_VERSION}`,
    api: `emb-api-${CACHE_VERSION}`
  };
  var CACHE_DURATION = {
    static: 30 * 24 * 60 * 60,
    // 30 jours
    dynamic: 7 * 24 * 60 * 60,
    // 7 jours
    images: 30 * 24 * 60 * 60,
    // 30 jours
    api: 5 * 60
    // 5 minutes
  };
  var MAX_CACHE_SIZE = {
    static: 50,
    dynamic: 100,
    images: 60,
    api: 30
  };
  var PRECACHE_URLS = [
    "/",
    "/offline.html",
    "/manifest.json"
  ];
  self.addEventListener("install", (event) => {
    console.log("[SW] Installation v" + CACHE_VERSION);
    event.waitUntil(
      caches.open(CACHE_NAMES.static).then((cache) => {
        console.log("[SW] Pr\xE9caching des URLs essentielles");
        return cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })));
      }).then(() => {
        console.log("[SW] Pr\xE9cache termin\xE9");
        return self.skipWaiting();
      }).catch((error) => {
        console.error("[SW] Erreur lors du pr\xE9cache:", error);
      })
    );
  });
  self.addEventListener("activate", (event) => {
    console.log("[SW] Activation v" + CACHE_VERSION);
    event.waitUntil(
      Promise.all([
        // Nettoyer les anciens caches
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.filter((name) => {
              return name.startsWith("emb-") && !Object.values(CACHE_NAMES).includes(name);
            }).map((name) => {
              console.log("[SW] Suppression ancien cache:", name);
              return caches.delete(name);
            })
          );
        }),
        // Prendre le contrôle de tous les clients immédiatement
        self.clients.claim()
      ]).then(() => {
        console.log("[SW] Service Worker activ\xE9 et en contr\xF4le");
        return self.clients.matchAll().then((clients2) => {
          clients2.forEach((client) => {
            client.postMessage({
              type: "SW_ACTIVATED",
              version: CACHE_VERSION
            });
          });
        });
      })
    );
  });
  async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(toDelete.map((key) => cache.delete(key)));
      console.log(`[SW] Cache ${cacheName} limit\xE9 \xE0 ${maxItems} entr\xE9es`);
    }
  }
  function isCacheExpired(cachedResponse, maxAge) {
    if (!cachedResponse)
      return true;
    const cachedDate = cachedResponse.headers.get("date");
    if (!cachedDate)
      return false;
    const cacheTime = new Date(cachedDate).getTime();
    const now = Date.now();
    const age = (now - cacheTime) / 1e3;
    return age > maxAge;
  }
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
      if (request.destination === "document") {
        return cache.match("/offline.html");
      }
      throw error;
    }
  }
  async function networkFirst(request, cacheName, maxAge, timeout = 3e3) {
    const cache = await caches.open(cacheName);
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Network timeout")), timeout);
      });
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
      console.log("[SW] Network failed, trying cache:", error.message);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      if (request.destination === "document") {
        return cache.match("/offline.html");
      }
      throw error;
    }
  }
  async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        await limitCacheSize(cacheName, MAX_CACHE_SIZE.images);
      }
      return networkResponse;
    });
    return cachedResponse || fetchPromise;
  }
  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== "GET") {
      return;
    }
    if (!url.protocol.startsWith("http")) {
      return;
    }
    event.respondWith(
      (async () => {
        try {
          if (request.destination === "image") {
            return await staleWhileRevalidate(request, CACHE_NAMES.images);
          }
          if (url.pathname.startsWith("/api/")) {
            return await networkFirst(request, CACHE_NAMES.api, CACHE_DURATION.api, 5e3);
          }
          if (request.destination === "script" || request.destination === "style" || request.destination === "font") {
            return await cacheFirst(request, CACHE_NAMES.static, CACHE_DURATION.static);
          }
          if (request.destination === "document") {
            return await networkFirst(request, CACHE_NAMES.dynamic, CACHE_DURATION.dynamic);
          }
          return await networkFirst(request, CACHE_NAMES.dynamic, CACHE_DURATION.dynamic);
        } catch (error) {
          console.error("[SW] Erreur lors du fetch:", error);
          if (request.destination === "document") {
            const cache = await caches.open(CACHE_NAMES.static);
            return cache.match("/offline.html");
          }
          return new Response("Service Worker: Erreur r\xE9seau", {
            status: 503,
            statusText: "Service Unavailable"
          });
        }
      })()
    );
  });
  self.addEventListener("push", (event) => {
    console.log("[SW] \u{1F4EC} Push notification re\xE7ue:", event);
    const defaultOptions = {
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: "open", title: "Ouvrir" },
        { action: "close", title: "Fermer" }
      ]
    };
    let notificationData = {
      title: "EMB - \xC9change Mobile Banking",
      body: "Nouvelle notification",
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
          data,
          vibrate: defaultOptions.vibrate,
          requireInteraction: data.requireInteraction !== void 0 ? data.requireInteraction : defaultOptions.requireInteraction,
          actions: defaultOptions.actions,
          tag: data.tag || "emb-notification",
          renotify: true,
          timestamp: Date.now()
        };
        console.log("[SW] \u{1F4E7} Notification pr\xE9par\xE9e:", notificationData.title);
      } catch (error) {
        console.error("[SW] \u274C Erreur parsing notification:", error);
      }
    }
    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData).then(() => {
        console.log("[SW] \u2705 Notification affich\xE9e avec succ\xE8s");
      }).catch((error) => {
        console.error("[SW] \u274C Erreur affichage notification:", error);
      })
    );
  });
  self.addEventListener("notificationclick", (event) => {
    console.log("[SW] \u{1F514} Notification cliqu\xE9e:", event.action);
    event.notification.close();
    if (event.action === "close") {
      console.log("[SW] Action: Fermer la notification");
      return;
    }
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        console.log("[SW] Clients ouverts:", clientList.length);
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("[SW] Focus sur la fen\xEAtre existante");
            return client.focus();
          }
        }
        if (clients.openWindow) {
          const url = event.notification.data?.url || "/dashboard";
          console.log("[SW] Ouverture nouvelle fen\xEAtre:", url);
          return clients.openWindow(url);
        }
      }).catch((error) => {
        console.error("[SW] Erreur lors de l'ouverture:", error);
      })
    );
  });
  self.addEventListener("notificationclose", (event) => {
    console.log("[SW] Notification ferm\xE9e");
  });
  self.addEventListener("sync", (event) => {
    console.log("[SW] \u{1F504} Background sync:", event.tag);
    if (event.tag === "sync-transactions") {
      event.waitUntil(syncTransactions());
    }
    if (event.tag === "sync-pending-data") {
      event.waitUntil(syncPendingData());
    }
  });
  async function syncTransactions() {
    try {
      console.log("[SW] Synchronisation des transactions en arri\xE8re-plan...");
      console.log("[SW] Synchronisation des transactions termin\xE9e");
    } catch (error) {
      console.error("[SW] Erreur sync transactions:", error);
      throw error;
    }
  }
  async function syncPendingData() {
    try {
      console.log("[SW] Synchronisation des donn\xE9es en attente...");
      console.log("[SW] Synchronisation termin\xE9e");
    } catch (error) {
      console.error("[SW] Erreur sync donn\xE9es:", error);
      throw error;
    }
  }
  self.addEventListener("periodicsync", (event) => {
    console.log("[SW] \u{1F504} Periodic background sync:", event.tag);
    if (event.tag === "content-sync") {
      event.waitUntil(periodicContentSync());
    }
  });
  async function periodicContentSync() {
    try {
      console.log("[SW] Synchronisation p\xE9riodique du contenu...");
      const criticalUrls = [
        "/api/exchange-pairs",
        "/api/system-status"
      ];
      const cache = await caches.open(CACHE_NAMES.api);
      await Promise.all(
        criticalUrls.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response.ok) {
              await cache.put(url, response.clone());
              console.log("[SW] Mis \xE0 jour:", url);
            }
          } catch (error) {
            console.error("[SW] Erreur mise \xE0 jour:", url, error);
          }
        })
      );
      console.log("[SW] Synchronisation p\xE9riodique termin\xE9e");
    } catch (error) {
      console.error("[SW] Erreur sync p\xE9riodique:", error);
    }
  }
  self.addEventListener("message", (event) => {
    console.log("[SW] \u{1F4AC} Message re\xE7u:", event.data);
    if (event.data && event.data.type === "SKIP_WAITING") {
      console.log("[SW] Skip waiting demand\xE9");
      self.skipWaiting();
    }
    if (event.data && event.data.type === "CLEAR_CACHE") {
      console.log("[SW] Nettoyage de tous les caches");
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((name) => {
              console.log("[SW] Suppression cache:", name);
              return caches.delete(name);
            })
          );
        }).then(() => {
          console.log("[SW] Tous les caches ont \xE9t\xE9 supprim\xE9s");
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
      );
    }
    if (event.data && event.data.type === "CHECK_UPDATE") {
      console.log("[SW] V\xE9rification de mise \xE0 jour");
      event.waitUntil(
        self.registration.update().then(() => {
          console.log("[SW] V\xE9rification de mise \xE0 jour termin\xE9e");
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
      );
    }
    if (event.data && event.data.type === "GET_VERSION") {
      if (event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_VERSION });
      }
    }
  });
  self.addEventListener("error", (event) => {
    console.error("[SW] \u26A0\uFE0F Erreur globale:", event.error);
  });
  self.addEventListener("unhandledrejection", (event) => {
    console.error("[SW] \u26A0\uFE0F Promise rejet\xE9e non g\xE9r\xE9e:", event.reason);
  });
  console.log("[SW] \u{1F680} Service Worker charg\xE9 - Version:", CACHE_VERSION);
})();
//# sourceMappingURL=sw.js.map
