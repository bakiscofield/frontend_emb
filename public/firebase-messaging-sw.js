// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBIq5UX5MTazEq1V2Pz4DenxeCD5QygmyY",
  authDomain: "notificationpush-1354a.firebaseapp.com",
  projectId: "notificationpush-1354a",
  storageBucket: "notificationpush-1354a.firebasestorage.app",
  messagingSenderId: "1051304096718",
  appId: "1:1051304096718:web:16a76bbb61ea0a7f1bf19f",
  measurementId: "G-8XJQL3TB1N"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Message reçu en background:', payload);

  const notificationTitle = payload.notification?.title || 'EMB - Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data,
    tag: 'emb-notification',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] Notification cliquée:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/dashboard';
          return clients.openWindow(url);
        }
      })
  );
});
