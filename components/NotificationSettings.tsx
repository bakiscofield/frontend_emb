'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Bell, BellOff, Loader2, Check, AlertCircle } from 'lucide-react';

export default function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleToggle = async () => {
    try {
      setMessage(null);
      if (isSubscribed) {
        await unsubscribe();
        setMessage({ type: 'success', text: 'Notifications désactivées' });
      } else {
        await subscribe();
        setMessage({ type: 'success', text: 'Notifications activées !' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la modification des notifications'
      });
    }
  };

  const handleTest = async () => {
    try {
      setTestLoading(true);
      setMessage(null);
      await sendTestNotification();
      setMessage({ type: 'success', text: 'Notification de test envoyée !' });
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de l\'envoi de la notification'
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">
              Notifications non supportées
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            isSubscribed ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isSubscribed ? (
              <Bell className="w-6 h-6 text-green-600" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-600" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications Push
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isSubscribed
                ? 'Vous recevez les notifications en temps réel'
                : 'Activez les notifications pour rester informé'}
            </p>

            {permission === 'denied' && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Les notifications sont bloquées. Autorisez-les dans les paramètres de votre navigateur.
              </div>
            )}

            {message && (
              <div className={`mt-3 text-sm rounded-lg p-3 flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {message.text}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleToggle}
            disabled={isLoading || permission === 'denied'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isSubscribed
                ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-cyan-300'
            } disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </>
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                Désactiver
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Activer
              </>
            )}
          </button>

          {isSubscribed && (
            <button
              onClick={handleTest}
              disabled={testLoading}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {testLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Tester
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
