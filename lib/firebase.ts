// Configuration Firebase pour EMB
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBIq5UX5MTazEq1V2Pz4DenxeCD5QygmyY",
  authDomain: "notificationpush-1354a.firebaseapp.com",
  projectId: "notificationpush-1354a",
  storageBucket: "notificationpush-1354a.firebasestorage.app",
  messagingSenderId: "1051304096718",
  appId: "1:1051304096718:web:16a76bbb61ea0a7f1bf19f",
  measurementId: "G-8XJQL3TB1N"
};

// Initialize Firebase (éviter la double initialisation)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Fonction pour obtenir le token FCM
export async function getFCMToken(): Promise<string | null> {
  try {
    // Vérifier si les notifications sont supportées
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('[Firebase] Messaging non supporté sur ce navigateur');
      return null;
    }

    const messaging = getMessaging(app);

    // Demander la permission pour les notifications
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('[Firebase] Permission de notification refusée');
      return null;
    }

    // Obtenir le token FCM
    // Clé VAPID depuis Firebase Console
    const vapidKey = 'BEHHX-2aL8mCQ5d2UIz0AL-QfHXOnxRK9UASjHhKQubby4biMRmH6IFihkiT2Sv5EIYNRPWv6dEIN7prUQXqg-0';

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('[Firebase] Token FCM obtenu:', token);
      return token;
    } else {
      console.log('[Firebase] Impossible d\'obtenir le token FCM');
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Erreur lors de l\'obtention du token:', error);
    return null;
  }
}

// Écouter les messages en foreground
export async function onMessageListener() {
  const messagingSupported = await isSupported();
  if (!messagingSupported) {
    return new Promise(() => {});
  }

  const messaging = getMessaging(app);

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('[Firebase] Message reçu en foreground:', payload);
      resolve(payload);
    });
  });
}

export { app };
