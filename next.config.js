/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // Désactiver la collecte de traces qui cause des problèmes
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
