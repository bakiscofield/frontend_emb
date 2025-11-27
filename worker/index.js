// Service Worker pour gérer les notifications push

// Écouter les notifications push
self.addEventListener('push', function(event) {
  console.log('[SW] Push reçu:', event);

  let data = {
    title: 'EMB Banking',
    body: 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      notificationId: data.notificationId
    },
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ],
    tag: data.notificationId || 'emb-notification',
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification cliquée:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si une fenêtre est déjà ouverte, la focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification fermée:', event);
});
