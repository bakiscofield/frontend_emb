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
    // Vérifier le support du service worker
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Enregistrer le service worker immédiatement
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })
          .then((registration) => {
            console.log('[SW] Service Worker enregistré avec succès');
            console.log('[SW] Scope:', registration.scope);

            // Vérifier les mises à jour périodiquement (toutes les 60 minutes)
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Gérer les mises à jour du service worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('[SW] Nouvelle version du service worker détectée');

              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  console.log('[SW] État du nouveau worker:', newWorker.state);

                  // Quand le nouveau worker est installé et qu'il y a déjà un worker actif
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[SW] Nouvelle version prête à être activée');

                    // Activer automatiquement la nouvelle version
                    newWorker.postMessage({ type: 'SKIP_WAITING' });

                    // Optionnel: Afficher une notification à l'utilisateur
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('EMB - Mise à jour disponible', {
                        body: 'Une nouvelle version de l\'application est disponible',
                        icon: '/icon-192x192.png',
                        tag: 'app-update'
                      });
                    }
                  }

                  if (newWorker.state === 'activated') {
                    console.log('[SW] Nouvelle version activée');
                  }
                });
              }
            });

            // Forcer l'activation si un worker est en attente
            if (registration.waiting) {
              console.log('[SW] Un service worker est en attente, activation...');
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Enregistrer la synchronisation périodique en arrière-plan
            if ('periodicSync' in registration) {
              (async () => {
                try {
                  const status = await navigator.permissions.query({
                    name: 'periodic-background-sync' as PermissionName,
                  });

                  if (status.state === 'granted') {
                    await (registration as any).periodicSync.register('content-sync', {
                      minInterval: 24 * 60 * 60 * 1000, // 24 heures
                    });
                    console.log('[SW] Synchronisation périodique enregistrée');
                  }
                } catch (error) {
                  console.log('[SW] Synchronisation périodique non supportée:', error);
                }
              })();
            }

            // Écouter les messages du service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data && event.data.type === 'SW_ACTIVATED') {
                console.log('[SW] Service Worker actif - Version:', event.data.version);
              }

              if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
                console.log('[SW] Nouvelle version disponible');
              }
            });
          })
          .catch((error) => {
            console.error('[SW] Erreur lors de l\'enregistrement:', error);
          });

        // Gérer le changement de controller (nouvelle version activée)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[SW] Controller changé - Rechargement de la page');
            window.location.reload();
          }
        });

        // Demander la permission pour les notifications (de manière non intrusive)
        if ('Notification' in window && Notification.permission === 'default') {
          const requestNotificationPermission = () => {
            Notification.requestPermission().then((permission) => {
              console.log('[Notification] Permission:', permission);
              // Retirer le listener après la première demande
              document.removeEventListener('click', requestNotificationPermission);
            });
          };

          // Demander uniquement après une interaction utilisateur
          document.addEventListener('click', requestNotificationPermission, { once: true });
        }

        // Vérifier le statut de connexion et gérer le mode offline
        window.addEventListener('online', () => {
          console.log('[Network] Application en ligne');
          // Synchroniser les données en attente
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
              if ('sync' in registration) {
                (registration as any).sync.register('sync-pending-data');
              }
            });
          }
        });

      window.addEventListener('offline', () => {
        console.log('[Network] Application hors ligne');
      });
    } else {
      console.warn('[SW] Service Worker non supporté par ce navigateur');
    }
  }, []);

  return null;
}
