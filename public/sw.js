// Service Worker pour les notifications push

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push reçu:', event);

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
    title: 'EMILE TRANSFER',
    body: 'Nouvelle notification',
    ...defaultOptions
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'EMILE TRANSFER',
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
      console.error('[Service Worker] Erreur parsing notification:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification cliquée:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.indexOf(self.location.origin) >= 0 && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification fermée:', event);
});

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installation');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activation');
  event.waitUntil(clients.claim());
});
