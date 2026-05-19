import { useNotifications } from './NotificationSystem';

/**
 * Convenience hooks for common notification patterns
 */
export const useNotificationHelpers = () => {
  const { showToast, showBanner } = useNotifications();

  return {
    // Success notifications
    notifySuccess: (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },

    notifySaved: () => {
      showToast({ type: 'success', title: 'Saved successfully' });
    },

    notifyCreated: (itemName: string) => {
      showToast({ 
        type: 'success', 
        title: `${itemName} created`,
        message: 'Your changes have been saved.'
      });
    },

    notifyUpdated: (itemName: string) => {
      showToast({ 
        type: 'success', 
        title: `${itemName} updated`,
        message: 'Your changes have been saved.'
      });
    },

    notifyDeleted: (itemName: string) => {
      showToast({ 
        type: 'success', 
        title: `${itemName} deleted`,
        message: 'The item has been removed.'
      });
    },

    // Error notifications
    notifyError: (title: string, message?: string) => {
      showToast({ type: 'error', title, message, duration: 0 });
    },

    notifyNetworkError: () => {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to server. Please check your internet connection.',
        duration: 0,
      });
    },

    notifyServerError: () => {
      showToast({
        type: 'error',
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
        duration: 0,
      });
    },

    notifyValidationError: (message: string) => {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message,
      });
    },

    notifyUploadError: () => {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Unable to upload file. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    },

    // Warning notifications
    notifyWarning: (title: string, message?: string) => {
      showToast({ type: 'warning', title, message });
    },

    notifyUnsavedChanges: () => {
      showToast({
        type: 'warning',
        title: 'Unsaved Changes',
        message: 'You have unsaved changes that will be lost.',
      });
    },

    notifyStorageLimit: (percentage: number) => {
      showToast({
        type: 'warning',
        title: 'Storage Almost Full',
        message: `You have used ${percentage}% of your storage quota.`,
      });
    },

    // Info notifications
    notifyInfo: (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },

    notifySessionExpiring: () => {
      showToast({
        type: 'info',
        title: 'Session Expiring Soon',
        message: 'Your session will expire in 5 minutes.',
      });
    },

    // AI notifications
    notifyAIProcessing: (message: string = 'AI is processing...') => {
      showToast({
        type: 'ai',
        title: 'AI Processing',
        message,
        duration: 0,
      });
    },

    notifyAIComplete: (message: string = 'AI processing complete') => {
      showToast({
        type: 'ai',
        title: 'AI Complete',
        message,
      });
    },

    // Banner notifications
    showErrorBanner: (title: string, message?: string) => {
      showBanner({ type: 'error', title, message });
    },

    showSuccessBanner: (title: string, message?: string) => {
      showBanner({ type: 'success', title, message });
    },

    showMaintenanceBanner: () => {
      showBanner({
        type: 'warning',
        title: 'Scheduled Maintenance',
        message: 'System will be down for maintenance on Sunday at 2 AM UTC.',
      });
    },
  };
};

/**
 * Hook for API error handling with notifications
 */
export const useApiErrorHandler = () => {
  const { notifyError, notifyNetworkError, notifyServerError } = useNotificationHelpers();

  const handleApiError = (error: any) => {
    if (!error.response) {
      // Network error
      notifyNetworkError();
    } else if (error.response.status >= 500) {
      // Server error
      notifyServerError();
    } else if (error.response.status === 401) {
      notifyError('Unauthorized', 'Please sign in to continue.');
    } else if (error.response.status === 403) {
      notifyError('Access Denied', 'You do not have permission to perform this action.');
    } else if (error.response.status === 404) {
      notifyError('Not Found', 'The requested resource was not found.');
    } else if (error.response.data?.detail) {
      notifyError('Error', error.response.data.detail);
    } else {
      notifyError('Error', 'An unexpected error occurred.');
    }
  };

  return { handleApiError };
};
