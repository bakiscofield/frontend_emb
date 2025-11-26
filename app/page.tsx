'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      {/* Logo qui grandit progressivement */}
      <div className="animate-logo-zoom">
        <Image
          src="/logo.png"
          alt="EMILE TRANSFER+"
          width={400}
          height={150}
          className="w-auto h-auto max-w-[300px] md:max-w-[400px]"
          priority
        />
      </div>

      {/* Texte de chargement */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-lg">
          Chargement<span className="loading-dots"></span>
        </p>
      </div>

      {/* Barre de progression avec effet néon rouge */}
      <div className="mt-6 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emile-red-neon to-emile-red-glow animate-progress-bar"></div>
      </div>
    </div>
  );
}
