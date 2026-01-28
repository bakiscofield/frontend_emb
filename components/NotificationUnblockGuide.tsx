'use client';

import { useEffect, useState } from 'react';
import { Chrome, Info, X } from 'lucide-react';

interface BrowserInfo {
  name: string;
  icon: string;
  steps: { text: string; detail?: string }[];
}

function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;

  // Chrome ou Edge
  if (ua.includes('Chrome') || ua.includes('Edg')) {
    const isEdge = ua.includes('Edg');
    return {
      name: isEdge ? 'Microsoft Edge' : 'Google Chrome',
      icon: '🌐',
      steps: [
        {
          text: '1. Cliquez sur l\'icône de cadenas 🔒',
          detail: 'À gauche de la barre d\'adresse (à côté de l\'URL)'
        },
        {
          text: '2. Cliquez sur "Paramètres du site"',
          detail: 'Dans le menu qui s\'ouvre'
        },
        {
          text: '3. Trouvez "Notifications"',
          detail: 'Dans la liste des autorisations'
        },
        {
          text: '4. Sélectionnez "Autoriser"',
          detail: 'À la place de "Bloquer"'
        },
        {
          text: '5. Rechargez la page',
          detail: 'Appuyez sur F5 ou Ctrl+R'
        }
      ]
    };
  }

  // Firefox
  if (ua.includes('Firefox')) {
    return {
      name: 'Mozilla Firefox',
      icon: '🦊',
      steps: [
        {
          text: '1. Cliquez sur l\'icône d\'information ℹ️',
          detail: 'À gauche de la barre d\'adresse'
        },
        {
          text: '2. Cliquez sur la flèche à droite de "Permissions"',
          detail: 'Pour développer la section'
        },
        {
          text: '3. Trouvez "Recevoir des notifications"',
          detail: 'Dans la liste des permissions'
        },
        {
          text: '4. Décochez "Utiliser les paramètres par défaut"',
          detail: 'Si coché'
        },
        {
          text: '5. Sélectionnez "Autoriser"',
          detail: 'Dans le menu déroulant'
        },
        {
          text: '6. Rechargez la page',
          detail: 'Appuyez sur F5 ou Ctrl+R'
        }
      ]
    };
  }

  // Safari
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return {
      name: 'Safari',
      icon: '🧭',
      steps: [
        {
          text: '1. Ouvrez Safari → Préférences',
          detail: 'Ou appuyez sur Cmd+,'
        },
        {
          text: '2. Allez dans l\'onglet "Sites web"',
          detail: 'En haut de la fenêtre'
        },
        {
          text: '3. Cliquez sur "Notifications" dans la liste de gauche',
          detail: 'Descendez si nécessaire'
        },
        {
          text: '4. Trouvez ce site dans la liste',
          detail: 'Ou vérifiez "Autoriser" pour tous les sites'
        },
        {
          text: '5. Sélectionnez "Autoriser"',
          detail: 'Au lieu de "Refuser"'
        },
        {
          text: '6. Rechargez la page',
          detail: 'Appuyez sur Cmd+R'
        }
      ]
    };
  }

  // Autre navigateur
  return {
    name: 'Votre navigateur',
    icon: '🌐',
    steps: [
      {
        text: '1. Recherchez l\'icône de paramètres ou de sécurité',
        detail: 'Généralement dans la barre d\'adresse'
      },
      {
        text: '2. Trouvez les paramètres du site ou permissions',
        detail: 'Cherchez "Notifications" ou "Permissions"'
      },
      {
        text: '3. Autorisez les notifications pour ce site',
        detail: 'Changez de "Bloquer" à "Autoriser"'
      },
      {
        text: '4. Rechargez la page',
        detail: 'Appuyez sur F5'
      }
    ]
  };
}

interface NotificationUnblockGuideProps {
  onClose?: () => void;
  compact?: boolean;
}

export default function NotificationUnblockGuide({
  onClose,
  compact = false
}: NotificationUnblockGuideProps) {
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  if (!browser) return null;

  if (compact && !isExpanded) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{browser.icon}</div>
            <div>
              <p className="text-sm font-medium text-white">
                Notifications bloquées sur {browser.name}
              </p>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-400 hover:text-blue-300 underline mt-0.5"
              >
                Voir comment débloquer →
              </button>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-2xl">
            {browser.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Débloquer les notifications
            </h3>
            <p className="text-sm text-gray-300">
              Sur {browser.name} - 30 secondes
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        {browser.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-300 text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {step.text.replace(/^\d+\.\s*/, '')}
              </p>
              {step.detail && (
                <p className="text-gray-400 text-xs mt-1">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-cyan-200">
          <strong>Astuce :</strong> Ces notifications vous permettent d'être informé instantanément de toutes vos transactions. C'est gratuit et vous pouvez les désactiver à tout moment.
        </p>
      </div>

      {/* Action button */}
      <button
        onClick={() => window.location.reload()}
        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
      >
        J'ai autorisé, recharger la page
      </button>
    </div>
  );
}
