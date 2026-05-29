import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast } from './Toast';
import { GlobalBanner } from './GlobalBanner';
import { toast as sonnerToast } from 'sonner';

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

  useEffect(() => {
    const handleFeatureBlocked = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail || {};
      const featureKey = detail.feature_key || detail.feature || detail.module_key || detail.endpoint || 'unknown feature';
      const mode = detail.mode;
      const message = detail.detail || (mode === 'maintenance'
        ? 'This feature is under maintenance and will be available again soon.'
        : 'Subscription needed. You can open the feature page, but this action is locked until you upgrade or your limit resets.');

      setBanner({
        id: `banner-${Date.now()}`,
        type: 'warning',
        title: mode === 'maintenance' ? `Maintenance: ${featureKey}` : `Subscription needed: ${featureKey}`,
        message,
        action: {
          label: 'Dismiss',
          onClick: () => setBanner(null),
        },
      });
    };

    window.addEventListener('feature-blocked', handleFeatureBlocked as EventListener);
    return () => window.removeEventListener('feature-blocked', handleFeatureBlocked as EventListener);
  }, []);

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
