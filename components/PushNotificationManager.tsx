'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const urlBase64ToUint8Array = (base64String: string) => {
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
};

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Erreur lors de la vérification de la souscription:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      setIsLoading(true);

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Demander la permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast({
          title: 'Permission refusée',
          description: 'Vous devez autoriser les notifications pour recevoir des alertes.',
          variant: 'destructive'
        });
        return;
      }

      // Récupérer la clé publique VAPID depuis le backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/vapid-public-key`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Impossible de récupérer la clé VAPID');
      }

      const { publicKey } = await response.json();

      // S'abonner aux notifications push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Envoyer la souscription au backend
      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(pushSubscription)
      });

      if (!saveResponse.ok) {
        throw new Error('Impossible de sauvegarder la souscription');
      }

      setSubscription(pushSubscription);

      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez désormais des notifications push.',
      });
    } catch (error) {
      console.error('Erreur lors de la souscription:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications push.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);

      if (!subscription) {
        return;
      }

      // Se désabonner
      await subscription.unsubscribe();

      // Informer le backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      setSubscription(null);

      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push.',
      });
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver les notifications push.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {subscription ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribeFromPush}
          disabled={isLoading}
        >
          <BellOff className="h-4 w-4 mr-2" />
          Désactiver les notifications
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribeToPush}
          disabled={isLoading}
        >
          <Bell className="h-4 w-4 mr-2" />
          Activer les notifications
        </Button>
      )}
    </div>
  );
}
