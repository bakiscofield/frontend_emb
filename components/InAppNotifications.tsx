'use client';

import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface InAppNotification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  created_at: string;
  is_read: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function InAppNotifications() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [visible, setVisible] = useState<string[]>([]);
  const { token } = useAuthStore();

  // Polling pour récupérer les nouvelles notifications
  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/notifications/unread`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data: InAppNotification[] = await response.json();

          // Filtrer les nouvelles notifications
          const newNotifications = data.filter(
            (n) => !notifications.find(existing => existing.id === n.id)
          );

          if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev]);
            setVisible(prev => [...prev, ...newNotifications.map(n => String(n.id))]);
          }
        }
      } catch (error) {
        console.error('[InAppNotifications] Erreur:', error);
      }
    };

    // Fetch immédiat puis toutes les 10 secondes
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      // Masquer visuellement
      setVisible(prev => prev.filter(v => v !== String(id)));

      // Marquer comme lu dans le backend
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Retirer après animation
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 300);
    } catch (error) {
      console.error('[InAppNotifications] Erreur marquage lecture:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-900/20 to-green-800/20 border-green-500/30';
      case 'error':
        return 'from-red-900/20 to-red-800/20 border-red-500/30';
      case 'warning':
        return 'from-yellow-900/20 to-yellow-800/20 border-yellow-500/30';
      default:
        return 'from-blue-900/20 to-blue-800/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications
        .filter(n => visible.includes(n.id))
        .slice(0, 3) // Max 3 notifications visibles
        .map(notification => (
          <div
            key={notification.id}
            className={`bg-gradient-to-br ${getColor(notification.type)} border rounded-xl shadow-2xl p-4 backdrop-blur-sm animate-slide-left`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-gray-800/50 rounded-lg">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(notification.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <button
                onClick={() => markAsRead(notification.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
