'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export default function PushDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Check browser support
    diagnostics.push({
      name: 'Support du navigateur',
      status: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
        ? 'success'
        : 'error',
      message: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
        ? 'Le navigateur supporte les notifications push'
        : 'Le navigateur ne supporte pas les notifications push',
    });

    // 2. Check notification permission
    diagnostics.push({
      name: 'Permission de notification',
      status: Notification.permission === 'granted'
        ? 'success'
        : Notification.permission === 'denied'
          ? 'error'
          : 'warning',
      message: `Permission: ${Notification.permission}`,
    });

    // 3. Check service worker registration
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      diagnostics.push({
        name: 'Service Worker',
        status: registration ? 'success' : 'error',
        message: registration
          ? `Service worker enregistré (état: ${registration.active?.state})`
          : 'Service worker non enregistré',
        details: registration ? {
          scope: registration.scope,
          state: registration.active?.state,
          updateViaCache: registration.updateViaCache,
        } : undefined
      });

      // 4. Check existing push subscription
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        diagnostics.push({
          name: 'Souscription push existante',
          status: subscription ? 'success' : 'warning',
          message: subscription
            ? 'Une souscription push existe'
            : 'Aucune souscription push',
          details: subscription ? {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
          } : undefined
        });
      }

      // 5. Test FCM connectivity (Chrome/Edge)
      try {
        const testFetch = await fetch('https://fcm.googleapis.com/fcm/send', { method: 'HEAD', mode: 'no-cors' });
        diagnostics.push({
          name: 'Connectivité FCM (Google)',
          status: 'success',
          message: 'Connexion à FCM possible',
        });
      } catch (error: any) {
        diagnostics.push({
          name: 'Connectivité FCM (Google)',
          status: 'error',
          message: 'Impossible de se connecter à FCM',
          details: { error: error.message }
        });
      }

      // 6. Check HTTPS/localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      diagnostics.push({
        name: 'Contexte sécurisé',
        status: isSecure ? 'success' : 'error',
        message: isSecure
          ? `Contexte sécurisé (${window.location.protocol})`
          : 'Les notifications push nécessitent HTTPS ou localhost',
        details: {
          protocol: window.location.protocol,
          hostname: window.location.hostname,
        }
      });

      // 7. Test VAPID key retrieval
      try {
        const token = localStorage.getItem('emb-auth-storage');
        if (!token) {
          diagnostics.push({
            name: 'Authentification',
            status: 'error',
            message: 'Non authentifié - impossible de récupérer la clé VAPID',
          });
        } else {
          const parsed = JSON.parse(token);
          const authToken = parsed?.state?.token;

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/push/vapid-public-key`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          if (response.ok) {
            const data = await response.json();
            diagnostics.push({
              name: 'Clé VAPID',
              status: 'success',
              message: 'Clé VAPID récupérée avec succès',
              details: {
                keyLength: data.publicKey?.length,
                keyPreview: data.publicKey?.substring(0, 20) + '...'
              }
            });
          } else {
            diagnostics.push({
              name: 'Clé VAPID',
              status: 'error',
              message: `Erreur lors de la récupération (${response.status})`,
            });
          }
        }
      } catch (error: any) {
        diagnostics.push({
          name: 'Clé VAPID',
          status: 'error',
          message: 'Erreur lors de la récupération de la clé VAPID',
          details: { error: error.message }
        });
      }

      // 8. Browser user agent
      diagnostics.push({
        name: 'Navigateur',
        status: 'success',
        message: 'Information du navigateur',
        details: {
          userAgent: navigator.userAgent,
          vendor: navigator.vendor,
        }
      });

    } catch (error: any) {
      diagnostics.push({
        name: 'Erreur générale',
        status: 'error',
        message: error.message,
        details: { error }
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Diagnostics Push Notifications</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:bg-cyan-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            'Lancer le diagnostic'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-3">
                {getIcon(result.status)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-700 mt-1">{result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                        Détails
                      </summary>
                      <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          Cliquez sur "Lancer le diagnostic" pour vérifier la configuration des notifications push
        </div>
      )}
    </div>
  );
}
