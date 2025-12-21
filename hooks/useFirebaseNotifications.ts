'use client';

import { useEffect, useState } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';
import toast from 'react-hot-toast';

export function useFirebaseNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Demander la permission et obtenir le token
  const requestNotificationPermission = async () => {
    try {
      const fcmToken = await getFCMToken();

      if (fcmToken) {
        setToken(fcmToken);
        setNotificationPermission('granted');

        // Envoyer le token au backend pour le sauvegarder
        await saveTokenToBackend(fcmToken);

        toast.success('Notifications activées avec succès');
        return fcmToken;
      } else {
        setNotificationPermission(Notification.permission);
        toast.error('Impossible d\'activer les notifications');
        return null;
      }
    } catch (error) {
      console.error('[Notifications] Erreur:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return null;
    }
  };

  // Sauvegarder le token dans le backend
  const saveTokenToBackend = async (fcmToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fcm/save-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fcmToken })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde du token');
      }

      console.log('[Notifications] Token sauvegardé dans le backend');
    } catch (error) {
      console.error('[Notifications] Erreur sauvegarde token:', error);
    }
  };

  // Écouter les messages en foreground
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupListener = async () => {
      try {
        const payload: any = await onMessageListener();

        console.log('[Notifications] Message reçu en foreground:', payload);

        // Afficher une notification toast
        toast((t) => (
          <div onClick={() => {
            toast.dismiss(t.id);
            if (payload.data?.url) {
              window.location.href = payload.data.url;
            }
          }} style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 'bold' }}>
              {payload.notification?.title || 'Nouvelle notification'}
            </div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              {payload.notification?.body || ''}
            </div>
          </div>
        ), {
          duration: 5000,
          icon: '🔔',
        });

        // Afficher aussi une notification navigateur si l'app n'est pas au premier plan
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
      } catch (error) {
        console.error('[Notifications] Erreur listener:', error);
      }
    };

    setupListener();
  }, []);

  // Vérifier la permission au chargement
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  return {
    token,
    notificationPermission,
    requestNotificationPermission
  };
}
