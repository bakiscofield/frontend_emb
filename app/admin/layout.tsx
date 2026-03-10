'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { permissionsAPI } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, setAdminPermissions } = useAuthStore();

  // Rafraîchir les permissions à chaque changement de page admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    if (pathname === '/admin/login') return;

    const refreshPermissions = async () => {
      try {
        const response = await permissionsAPI.getMyPermissions();
        if (response.data.success) {
          setAdminPermissions(response.data.permissions);
        }
      } catch (error) {
        // Silently fail - les permissions du store restent en place
        console.error('Erreur rafraîchissement permissions:', error);
      }
    };

    refreshPermissions();
  }, [pathname, isAuthenticated, isAdmin]);

  return <>{children}</>;
}
