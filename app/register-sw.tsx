'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function RegisterServiceWorker() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Initialiser l'authentification depuis localStorage
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Enregistrer le service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(async (registration) => {
          console.log('[SW] Enregistrement réussi:', registration.scope);

          // Vérifier immédiatement les mises à jour
          registration.update();

          // Vérifier les mises à jour périodiquement (toutes les 5 minutes)
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);

          // Gérer les mises à jour automatiquement
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] Nouvelle version détectée');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] Nouvelle version installée - Activation automatique');
                  // Envoyer un message au SW pour activer immédiatement
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }

                if (newWorker.state === 'activated') {
                  console.log('[SW] Nouvelle version activée - Rechargement automatique');
                  // Recharger automatiquement pour appliquer la nouvelle version
                  window.location.reload();
                }
              });
            }
          });

          // Enregistrer la synchronisation périodique en arrière-plan
          if ('periodicSync' in registration) {
            try {
              const periodicSync = (registration as any).periodicSync;
              await periodicSync.register('content-sync', {
                minInterval: 24 * 60 * 60 * 1000, // 24 heures
              });
              console.log('[SW] Synchronisation périodique enregistrée');
            } catch (error) {
              console.log('[SW] Synchronisation périodique non supportée:', error);
            }
          }

          // Écouter les messages du service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_ACTIVATED') {
              console.log('[SW] Service Worker actif - Version:', event.data.version);
            }
          });

          // Forcer la prise de contrôle si un SW est en attente
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((error) => {
          console.error('[SW] Erreur enregistrement:', error);
        });

      // Gérer le rechargement automatique lorsque le controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[SW] Controller changé - Rechargement de la page');
          window.location.reload();
        }
      });

      // Demander permission pour notifications
      if ('Notification' in window && Notification.permission === 'default') {
        // On attend que l'utilisateur interagisse avant de demander
        const requestNotificationPermission = () => {
          Notification.requestPermission().then((permission) => {
            console.log('[Notification] Permission:', permission);
          });
        };

        // Ajouter un listener sur un clic utilisateur
        document.addEventListener('click', requestNotificationPermission, { once: true });
      }
    }
  }, []);

  return null;
}
