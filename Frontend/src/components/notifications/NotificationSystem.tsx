import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast } from './Toast';
import { GlobalBanner } from './GlobalBanner';
import { toast as sonnerToast } from 'sonner';
import { useAuthContext } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { realtimeService } from '@/lib/realtimeService';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'ai';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface NotificationContextType {
  showToast: (notification: Omit<Notification, 'id'>) => void;
  showBanner: (notification: Omit<Notification, 'id'>) => void;
  dismissToast: (id: string) => void;
  dismissBanner: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banner, setBanner] = useState<Notification | null>(null);
  const { user } = useAuthContext();
  const seenNotificationIdsRef = React.useRef<Set<number>>(new Set());

  const showToast = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = notification.duration === 0 ? Infinity : (notification.duration ?? 5000);
    
    const options = {
      description: notification.message,
      duration,
      id,
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick,
      } : undefined,
    };

    switch (notification.type) {
      case 'success':
        sonnerToast.success(notification.title, options);
        break;
      case 'error':
        sonnerToast.error(notification.title, options);
        break;
      case 'warning':
        sonnerToast.warning(notification.title, options);
        break;
      case 'info':
        sonnerToast.info(notification.title, options);
        break;
      case 'ai':
        sonnerToast(notification.title, {
          ...options,
          icon: '✨',
        });
        break;
      default:
        sonnerToast(notification.title, options);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      seenNotificationIdsRef.current.clear();
      return;
    }

    let cancelled = false;

    const loadUnreadNotifications = async () => {
      try {
        const response = await apiClient.getNotifications(50, true);
        if (cancelled) return;

        const unreadNotifications = response.notifications || [];
        if (!unreadNotifications.length) {
          return;
        }

        unreadNotifications.forEach((notification) => {
          if (seenNotificationIdsRef.current.has(notification.id)) {
            return;
          }

          let type: 'info' | 'success' | 'warning' | 'error' | 'ai' = 'info';
          if (notification.type === 'warning' || notification.type === 'maintenance' || notification.type === 'disabled') {
            type = 'warning';
          } else if (notification.type === 'success' || notification.type === 'offer') {
            type = 'success';
          } else if (notification.type === 'error') {
            type = 'error';
          } else if (notification.type === 'pricing') {
            type = 'ai';
          }

          showToast({
            type,
            title: notification.title || 'Platform Notification',
            message: notification.message,
            duration: 8000,
          });

          seenNotificationIdsRef.current.add(notification.id);
        });

        await apiClient.markAllNotificationsRead();
      } catch (error) {
        console.error('Failed to load unread notifications:', error);
      }
    };

    loadUnreadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user?.id, showToast]);

  // Listen to Socket.IO live notifications for logged-in users
  useEffect(() => {
    if (!user?.id) {
      if (realtimeService.isConnected()) {
        realtimeService.disconnect();
      }
      return;
    }

    // Connect to real-time server
    realtimeService.connect(Number(user.id));

    // Handle live incoming notifications
    const handleLiveAlert = (data: any) => {
      console.log('🔔 Notification event received via Socket.IO:', data);
      const noti = data.notification || {};

      if (noti.id && seenNotificationIdsRef.current.has(noti.id)) {
        return;
      }
      
      let type: 'info' | 'success' | 'warning' | 'error' | 'ai' = 'info';
      if (noti.type === 'warning' || noti.type === 'maintenance') {
        type = 'warning';
      } else if (noti.type === 'success' || noti.type === 'offer') {
        type = 'success';
      } else if (noti.type === 'error') {
        type = 'error';
      } else if (noti.type === 'pricing') {
        type = 'ai';
      }

      showToast({
        type,
        title: noti.title || 'Platform Notification',
        message: noti.message || noti.content,
        duration: 8000,
      });

      if (noti.id) {
        seenNotificationIdsRef.current.add(noti.id);
        apiClient.markNotificationRead(Number(noti.id)).catch((error) => {
          console.error('Failed to mark live notification as read:', error);
        });
      }
    };

    realtimeService.on('notification', handleLiveAlert);

    return () => {
      realtimeService.off('notification', handleLiveAlert);
    };
  }, [user?.id, showToast]);

  const showBanner = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `banner-${Date.now()}`;
    setBanner({ ...notification, id });
  }, []);

  const dismissToast = useCallback((id: string) => {
    sonnerToast.dismiss(id);
  }, []);

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showBanner, dismissToast, dismissBanner }}>
      {children}
      
      {/* Global Banner */}
      {banner && (
        <GlobalBanner
          type={banner.type}
          title={banner.title}
          message={banner.message}
          action={banner.action}
          onDismiss={dismissBanner}
        />
      )}
    </NotificationContext.Provider>
  );
};
