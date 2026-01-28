'use client';

import { useEffect, useRef, useState } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AutoPushNotifications() {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    requestPermission
  } = usePushNotifications();

  const [showPrompt, setShowPrompt] = useState(false);
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Attendre 2 secondes après le chargement pour demander
    const timer = setTimeout(() => {
      attemptAutoSubscribe();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const attemptAutoSubscribe = async () => {
    // Ne pas tenter plusieurs fois
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // Vérifier si supporté et pas déjà abonné
    if (!isSupported || isSubscribed) return;

    // Vérifier dans localStorage si l'utilisateur a déjà refusé
    const declinedTimestamp = localStorage.getItem('push-declined');
    if (declinedTimestamp) {
      const expiry = parseInt(declinedTimestamp);
      if (Date.now() < expiry) {
        // Le refus est encore valide
        return;
      } else {
        // Le refus a expiré, nettoyer
        localStorage.removeItem('push-declined');
      }
    }

    // Si permission déjà accordée, s'abonner automatiquement
    if (permission === 'granted') {
      try {
        await subscribe();
        console.log('[AutoPush] ✅ Abonnement automatique réussi');
      } catch (error) {
        console.error('[AutoPush] Erreur lors de l\'abonnement automatique:', error);
      }
      return;
    }

    // Si permission par défaut, afficher un prompt sympathique
    if (permission === 'default') {
      setShowPrompt(true);
    }
  };

  const handleAccept = async () => {
    try {
      setShowPrompt(false);
      const granted = await requestPermission();

      if (granted) {
        await subscribe();
        toast.success('🔔 Notifications activées ! Vous serez informé en temps réel.', {
          duration: 4000,
          icon: '✅'
        });
      } else {
        // Sauvegarder le refus (temporaire, 7 jours)
        const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 jours
        localStorage.setItem('push-declined', expiry.toString());
      }
    } catch (error: any) {
      console.error('[AutoPush] Erreur:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    }
  };

  const handleDecline = () => {
    setShowPrompt(false);
    // Sauvegarder le refus (temporaire, 7 jours)
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('push-declined', expiry.toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyan-500/30 rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={handleDecline}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 shadow-lg">
            <Bell className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-white font-bold text-xl mb-2">
              Ne ratez plus aucune transaction
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Soyez averti instantanément :
            </p>

            {/* Bénéfices clairs */}
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-200">Validation de vos transactions</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-200">Alertes de sécurité importantes</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-200">Mises à jour de vos opérations</span>
              </li>
            </ul>

            {/* Boutons avec CTA fort */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAccept}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <Bell className="w-5 h-5" />
                Activer maintenant
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-medium rounded-xl transition-all text-sm"
              >
                Plus tard
              </button>
            </div>

            {/* Réassurance */}
            <div className="flex items-center gap-2 mt-4 p-2 bg-gray-800/50 rounded-lg">
              <span className="text-xl">🔒</span>
              <p className="text-xs text-gray-400">
                Gratuit • Désactivable à tout moment • Aucun spam
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
