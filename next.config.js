const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false, // Service Worker TOUJOURS actif (dev + prod)
  register: false, // Désactiver l'enregistrement auto - on utilise notre register-sw.tsx
  skipWaiting: true,
  sw: 'sw.js', // Utiliser notre service worker personnalisé
  scope: '/',
  reloadOnOnline: true,
  swSrc: 'public/sw.js', // Source de notre SW personnalisé
  fallbacks: {
    document: '/offline.html',
  },
  // Configuration pour InjectManifest (mode avec SW personnalisé)
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  dynamicStartUrl: false,
  // Note: runtimeCaching n'est pas utilisé avec swSrc
  // Les stratégies de cache sont définies dans public/sw.js
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // Désactiver la vérification TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Désactiver ESLint pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Désactiver la collecte de traces qui cause des problèmes
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = withPWA(nextConfig)
