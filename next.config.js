const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false, // Service Worker TOUJOURS actif (dev + prod)
  register: false, // Désactiver l'enregistrement auto - on utilise notre register-sw.tsx
  skipWaiting: true,
  sw: 'sw.js',
  scope: '/',
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline.html',
  },
  // next-pwa utilisera automatiquement worker/index.js comme source
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  dynamicStartUrl: false,
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
