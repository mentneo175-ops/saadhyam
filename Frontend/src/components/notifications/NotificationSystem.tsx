import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast } from './Toast';
import { GlobalBanner } from './GlobalBanner';

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
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [banner, setBanner] = useState<Notification | null>(null);

  useEffect(() => {
    const handleFeatureBlocked = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail || {};
      const featureKey = detail.feature_key || detail.feature || detail.module_key || detail.endpoint || 'unknown feature';
      const mode = detail.mode;
      const message = detail.detail || (mode === 'maintenance'
        ? 'This feature is under maintenance and will be available again soon.'
        : 'This feature has been temporarily disabled by the admin team.');

      setBanner({
        id: `banner-${Date.now()}`,
        type: 'warning',
        title: `Feature blocked: ${featureKey}`,
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
    const newToast: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration);
    }
  }, []);

  const showBanner = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `banner-${Date.now()}`;
    setBanner({ ...notification, id });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            action={toast.action}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
