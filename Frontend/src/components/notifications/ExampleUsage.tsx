import React, { useState } from 'react';
import { useNotifications } from './NotificationSystem';
import { ValidatedInput } from './FormValidation';
import { AILoading, LoadingSpinner, ProgressBar, CardSkeleton } from './LoadingStates';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorStates';
import { ConfirmationModal } from './ConfirmationModal';
import { Inbox, Trash2 } from 'lucide-react';

/**
 * EXAMPLE USAGE COMPONENT
 * This demonstrates all notification system features
 */
export const NotificationExamples: React.FC = () => {
  const { showToast, showBanner } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Toast Examples
  const showSuccessToast = () => {
    showToast({
      type: 'success',
      title: 'Campaign Created',
      message: 'Your campaign has been published successfully.',
    });
  };

  const showErrorToast = () => {
    showToast({
      type: 'error',
      title: 'Upload Failed',
      message: 'Unable to upload file. Please try again.',
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  const showWarningToast = () => {
    showToast({
      type: 'warning',
      title: 'Storage Almost Full',
      message: 'You've used 90% of your storage quota.',
    });
  };

  const showInfoToast = () => {
    showToast({
      type: 'info',
      title: 'New Feature Available',
      message: 'Check out our new analytics dashboard.',
    });
  };

  const showAIToast = () => {
    showToast({
      type: 'ai',
      title: 'AI Content Generated',
      message: 'Your blog post is ready for review.',
      duration: 0, // Won't auto-dismiss
    });
  };

  // Banner Examples
  const showErrorBanner = () => {
    showBanner({
      type: 'error',
      title: 'Connection Lost',
      message: 'Unable to connect to server. Retrying...',
    });
  };

  const showSuccessBanner = () => {
    showBanner({
      type: 'success',
      title: 'All Systems Operational',
      message: 'Your data has been synced successfully.',
    });
  };

  // Form Validation Example
  const validateEmail = (value: string) => {
    setEmail(value);
    if (!value) {
      setEmailError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notification System Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Premium SaaS notification components with modern design
        </p>
      </div>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Toast Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={showSuccessToast}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Success Toast
          </button>
          <button
            onClick={showErrorToast}
            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Error Toast
          </button>
          <button
            onClick={showWarningToast}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            Warning Toast
          </button>
          <button
            onClick={showInfoToast}
            className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
          >
            Info Toast
          </button>
          <button
            onClick={showAIToast}
            className="px-4 py-2 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors"
          >
            AI Toast
          </button>
        </div>
      </section>

      {/* Global Banners */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Global Banners</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={showErrorBanner}
            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Error Banner
          </button>
          <button
            onClick={showSuccessBanner}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Success Banner
          </button>
        </div>
      </section>

      {/* Form Validation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Form Validation</h2>
        <div className="max-w-md">
          <ValidatedInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => validateEmail(e.target.value)}
            error={emailError}
            success={email && !emailError ? 'Email is valid' : undefined}
          />
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Loading</h3>
            <AILoading message="Generating content..." />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Spinner</h3>
            <LoadingSpinner size="md" message="Loading data..." />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Progress Bar</h3>
            <ProgressBar progress={65} message="Uploading files..." />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Card Skeleton</h3>
            <CardSkeleton />
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Empty State</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <EmptyState
            icon={Inbox}
            title="No campaigns yet"
            description="Create your first campaign to start reaching your audience."
            action={{
              label: 'Create Campaign',
              onClick: () => console.log('Create clicked'),
            }}
          />
        </div>
      </section>

      {/* Error States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error States</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <ErrorState
            type="network"
            onRetry={() => console.log('Retry clicked')}
          />
        </div>
      </section>

      {/* Confirmation Modal */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmation Modal</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
        >
          Delete Campaign
        </button>
        <ConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => console.log('Confirmed')}
          title="Delete Campaign?"
          description="This action cannot be undone. All campaign data will be permanently deleted."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
        />
      </section>
    </div>
  );
};
