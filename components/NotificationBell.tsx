'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/lib/store';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  transaction_id?: number;
}

interface NotificationData {
  notifications: Notification[];
  unread_count: number;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuthStore();

  // Polling pour récupérer les notifications toutes les 10 secondes
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!token) {
          console.log('[Notifications] Pas de token disponible');
          return;
        }

        const response = await axios.get<{ success: boolean; data: NotificationData }>(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setNotifications(response.data.data.notifications);
          setUnreadCount(response.data.data.unread_count);
          console.log('[Notifications] Récupérées:', response.data.data.notifications.length);
        }
      } catch (error: any) {
        console.error('[Notifications] Erreur lors de la récupération:', error.response?.data || error.message);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll toutes les 10 secondes

    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      if (!token) return;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Notifications] Erreur lors du marquage:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!token) return;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[Notifications] Erreur lors du marquage de toutes:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      if (!token) return;

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === id);
        return deletedNotif && !deletedNotif.is_read ? Math.max(0, prev - 1) : prev;
      });
      console.log('[Notifications] Notification supprimée:', id);
    } catch (error) {
      console.error('[Notifications] Erreur lors de la suppression:', error);
    }
  };

  const clearAllRead = async () => {
    try {
      if (!token) return;

      const readNotifications = notifications.filter(n => n.is_read);

      await Promise.all(
        readNotifications.map(n =>
          axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${n.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
        )
      );

      setNotifications(prev => prev.filter(n => !n.is_read));
      console.log('[Notifications] Toutes les notifications lues supprimées');
    } catch (error) {
      console.error('[Notifications] Erreur lors du nettoyage:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction_validated':
        return '✅';
      case 'transaction_rejected':
        return '❌';
      case 'new_transaction':
        return '🔔';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto sm:mt-2 max-w-md sm:w-96 max-h-[85vh] sm:max-h-[32rem] overflow-hidden rounded-xl sm:rounded-2xl bg-white backdrop-blur-xl border border-gray-200 shadow-2xl z-50"
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium transition-colors whitespace-nowrap"
                    >
                      Tout lire
                    </button>
                  )}
                  {notifications.some(n => n.is_read) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllRead();
                      }}
                      className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors whitespace-nowrap"
                      title="Supprimer les notifications lues"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Nettoyer
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[calc(85vh-60px)] sm:max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-gray-500">
                    <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50 text-gray-400" />
                    <p className="text-sm sm:text-base">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        p-3 sm:p-4 border-b border-gray-200 cursor-pointer relative group
                        transition-colors hover:bg-gray-50 active:bg-gray-100
                        ${!notification.is_read ? 'bg-red-50' : 'bg-white'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-gray-900 font-medium text-sm sm:text-base line-clamp-1 pr-6">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1 sm:mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                            {new Date(notification.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Supprimer"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
