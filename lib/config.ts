// Configuration runtime chargée depuis config.json
// Ceci évite d'exposer l'URL dans le bundle JavaScript

interface AppConfig {
  apiUrl: string;
  version: string;
  appName: string;
}

let cachedConfig: AppConfig | null = null;

/**
 * Charge la configuration depuis config.json
 * Utilise un cache pour éviter de charger plusieurs fois
 */
export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Charger la configuration depuis le fichier public
    const response = await fetch('/config.json', {
      cache: 'no-store', // Ne pas cacher ce fichier
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Impossible de charger la configuration');
    }

    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration:', error);

    // Fallback sur une configuration par défaut
    cachedConfig = {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      version: '1.0.0',
      appName: 'EMB Transfer'
    };

    return cachedConfig;
  }
}

/**
 * Obtient l'URL de l'API de manière synchrone
 * À utiliser après avoir appelé loadConfig() au démarrage
 */
export function getApiUrl(): string {
  if (cachedConfig) {
    return cachedConfig.apiUrl;
  }

  // Fallback pour le développement
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

/**
 * Réinitialise le cache de configuration
 * Utile pour forcer un rechargement
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
