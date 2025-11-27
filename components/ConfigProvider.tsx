'use client';

import { useEffect, useState } from 'react';
import { loadConfig } from '@/lib/config';

export default function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    // Charger la configuration au démarrage de l'application
    loadConfig()
      .then(() => {
        console.log('✅ Configuration chargée');
        setIsConfigLoaded(true);
      })
      .catch((error) => {
        console.error('❌ Erreur chargement config:', error);
        // Continuer quand même avec les valeurs par défaut
        setIsConfigLoaded(true);
      });
  }, []);

  // Afficher un loader pendant le chargement de la config
  if (!isConfigLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e27]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
