import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import RegisterServiceWorker from './register-sw';
import AppLoader from '@/components/AppLoader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EMB - Échange Mobile Banking',
  description: 'Application d\'échange de moyens de paiement mobile',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EMB',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#06b6d4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AppLoader />
        <RegisterServiceWorker />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              maxWidth: '90vw',
            },
            success: {
              duration: 2500,
              iconTheme: {
                primary: '#06b6d4',
                secondary: '#fff',
              },
            },
            error: {
              duration: 3500,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
