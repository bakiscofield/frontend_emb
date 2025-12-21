'use client';

import { Bell, BellOff } from 'lucide-react';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function NotificationButton() {
  const { notificationPermission, requestNotificationPermission } = useFirebaseNotifications();

  const handleToggleNotifications = async () => {
    if (notificationPermission === 'granted') {
      // Les notifications sont déjà activées
      return;
    }

    await requestNotificationPermission();
  };

  return (
    <button
      onClick={handleToggleNotifications}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${notificationPermission === 'granted'
          ? 'bg-cyan-500/20 text-cyan-400 cursor-default'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }
      `}
      disabled={notificationPermission === 'granted'}
    >
      {notificationPermission === 'granted' ? (
        <>
          <Bell size={20} />
          <span>Notifications activées</span>
        </>
      ) : (
        <>
          <BellOff size={20} />
          <span>Activer les notifications</span>
        </>
      )}
    </button>
  );
}
