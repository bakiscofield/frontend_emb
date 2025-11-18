'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Enregistrement réussi:', registration.scope);

          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] Nouvelle version détectée');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[SW] Nouvelle version activée');
                  // Optionnel: afficher notification à l'utilisateur
                  if (window.confirm('Nouvelle version disponible. Recharger ?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Erreur enregistrement:', error);
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
