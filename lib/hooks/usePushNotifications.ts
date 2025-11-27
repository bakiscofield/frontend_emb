'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    if (typeof window !== 'undefined') {
      const isSupported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
      }));

      // Vérifier si déjà abonné
      if (isSupported) {
        checkSubscription();
      }
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState(prev => ({
        ...prev,
        isSubscribed: subscription !== null,
      }));
    } catch (error) {
      console.error('[Push] Erreur lors de la vérification:', error);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.error('[Push] Push notifications non supportées');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      return permission === 'granted';
    } catch (error) {
      console.error('[Push] Erreur lors de la demande de permission:', error);
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

      // Récupérer la clé publique VAPID
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const { data } = await axios.get(`${API_URL}/push/vapid-public-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const publicKey = data.publicKey;

      // S'abonner aux push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Enregistrer l'abonnement sur le serveur
      await axios.post(
        `${API_URL}/push/subscribe`,
        subscription.toJSON(),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      console.log('[Push] Abonnement réussi');
    } catch (error) {
      console.error('[Push] Erreur lors de l\'abonnement:', error);
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // Se désabonner localement
        await subscription.unsubscribe();

        // Supprimer l'abonnement du serveur
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        if (token) {
          await axios.post(
            `${API_URL}/push/unsubscribe`,
            { endpoint },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      console.log('[Push] Désabonnement réussi');
    } catch (error) {
      console.error('[Push] Erreur lors du désabonnement:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, state.isSubscribed]);

  const sendTestNotification = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Non authentifié');
      }

      await axios.post(
        `${API_URL}/push/test`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('[Push] Notification de test envoyée');
    } catch (error) {
      console.error('[Push] Erreur lors de l\'envoi de la notification de test:', error);
      throw error;
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

// Fonction utilitaire pour convertir la clé publique VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
