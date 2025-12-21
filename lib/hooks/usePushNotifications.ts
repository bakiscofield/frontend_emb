'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const VAPID_KEY = 'BEHHX-2aL8mCQ5d2UIz0AL-QfHXOnxRK9UASjHhKQubby4biMRmH6IFihkiT2Sv5EIYNRPWv6dEIN7prUQXqg-0';

// Helper function to get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const storage = localStorage.getItem('emb-auth-storage');
    if (!storage) return null;
    const parsed = JSON.parse(storage);
    return parsed?.state?.token || null;
  } catch (error) {
    console.error('[Firebase Push] Error getting auth token:', error);
    return null;
  }
};

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default',
  });

  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window !== 'undefined') {
        const messagingSupported = await isSupported();
        const basicSupport = 'serviceWorker' in navigator && 'Notification' in window;

        setState(prev => ({
          ...prev,
          isSupported: messagingSupported && basicSupport,
          permission: basicSupport ? Notification.permission : 'denied',
        }));

        // Vérifier si déjà abonné (Firebase token existe)
        if (messagingSupported && basicSupport) {
          checkSubscription();
        }
      }
    };

    checkSupport();
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      // Vérifier si un token FCM existe déjà dans le localStorage
      const fcmToken = localStorage.getItem('fcm-token');

      setState(prev => ({
        ...prev,
        isSubscribed: fcmToken !== null,
      }));
    } catch (error) {
      console.error('[Firebase Push] Erreur lors de la vérification:', error);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.error('[Firebase Push] Push notifications non supportées');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      return permission === 'granted';
    } catch (error) {
      console.error('[Firebase Push] Erreur lors de la demande de permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported || state.isSubscribed) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Demander la permission si nécessaire
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Permission refusée');
        }
      }

      console.log('[Firebase Push] Attente du service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[Firebase Push] Service worker prêt');

      // Obtenir le token FCM
      console.log('[Firebase Push] Obtention du token FCM...');
      const messaging = getMessaging(app);

      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!fcmToken) {
        throw new Error('Impossible d\'obtenir le token FCM');
      }

      console.log('[Firebase Push] Token FCM obtenu:', fcmToken);

      // Sauvegarder le token localement
      localStorage.setItem('fcm-token', fcmToken);

      // Envoyer le token au backend pour le sauvegarder
      const authToken = getAuthToken();
      if (authToken) {
        try {
          await axios.post(
            `${API_URL}/api/fcm/save-token`,
            { fcmToken },
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
          console.log('[Firebase Push] Token sauvegardé sur le serveur');
        } catch (error) {
          console.warn('[Firebase Push] Erreur sauvegarde backend:', error);
          // Continue même si le backend échoue
        }
      }

      // Écouter les messages en foreground
      onMessage(messaging, (payload) => {
        console.log('[Firebase Push] Message reçu en foreground:', payload);

        // Afficher une notification si l'app n'est pas au premier plan
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(
            payload.notification?.title || 'EMB - Notification',
            {
              body: payload.notification?.body || '',
              icon: payload.notification?.icon || '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: payload.data
            }
          );
        }
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      console.log('[Firebase Push] Abonnement réussi');
    } catch (error: any) {
      console.error('[Firebase Push] Erreur lors de l\'abonnement:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, state.isSubscribed, state.permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !state.isSubscribed) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const fcmToken = localStorage.getItem('fcm-token');

      // Supprimer le token du backend
      const authToken = getAuthToken();
      if (authToken && fcmToken) {
        try {
          await axios.post(
            `${API_URL}/api/fcm/delete-token`,
            { fcmToken },
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
          console.log('[Firebase Push] Token supprimé du serveur');
        } catch (error) {
          console.warn('[Firebase Push] Erreur suppression backend:', error);
        }
      }

      // Supprimer le token localement
      localStorage.removeItem('fcm-token');

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      console.log('[Firebase Push] Désabonnement réussi');
    } catch (error) {
      console.error('[Firebase Push] Erreur lors du désabonnement:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, state.isSubscribed]);

  const sendTestNotification = useCallback(async () => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Non authentifié');
      }

      const fcmToken = localStorage.getItem('fcm-token');
      if (!fcmToken) {
        throw new Error('Pas de token FCM');
      }

      // Envoyer une requête au backend pour envoyer une notification de test
      await axios.post(
        `${API_URL}/api/fcm/test-notification`,
        { fcmToken },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      console.log('[Firebase Push] Notification de test envoyée');
    } catch (error) {
      console.error('[Firebase Push] Erreur lors de l\'envoi de la notification de test:', error);

      // Fallback: afficher une notification locale
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('EMB - Notification de test', {
          body: 'Ceci est une notification de test Firebase',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission,
  };
}
