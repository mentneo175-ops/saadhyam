import React, { useState } from 'react';
import { useNotificationHelpers, useApiErrorHandler } from './useNotificationHelpers';
import { ValidatedInput } from './FormValidation';
import { AILoading } from './LoadingStates';
import { ConfirmationModal } from './ConfirmationModal';

/**
 * REAL-WORLD INTEGRATION EXAMPLE
 * Shows how to use notifications in actual dashboard features
 */

// Example 1: Campaign Creation Form
export const CampaignForm: React.FC = () => {
  const { notifySuccess, notifyValidationError } = useNotificationHelpers();
  const { handleApiError } = useApiErrorHandler();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setNameError('Campaign name is required');
      notifyValidationError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // API call
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      notifySuccess('Campaign Created', 'Your campaign is now live.');
      setName('');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ValidatedInput
        label="Campaign Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError('');
        }}
        error={nameError}
        placeholder="Enter campaign name"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  );
};

// Example 2: Delete Confirmation
export const DeleteCampaignButton: React.FC<{ campaignId: string; campaignName: string }> = ({
  campaignId,
  campaignName,
}) => {
  const { notifyDeleted } = useNotificationHelpers();
  const { handleApiError } = useApiErrorHandler();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      notifyDeleted('Campaign');
      // Redirect or refresh list
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
      >
        Delete
      </button>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete Campaign?"
        description={`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </>
  );
};

// Example 3: AI Content Generation
export const AIContentGenerator: React.FC = () => {
  const { notifyAIProcessing, notifyAIComplete } = useNotificationHelpers();
  const { handleApiError } = useApiErrorHandler();
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    notifyAIProcessing('Generating content...');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Generate blog post' }),
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const data = await response.json();
      setContent(data.content);
      notifyAIComplete('Your content is ready!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium"
      >
        Generate Content
      </button>

      {isGenerating && <AILoading message="AI is generating your content..." />}

      {content && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border">
          <p>{content}</p>
        </div>
      )}
    </div>
  );
};

// Example 4: File Upload with Progress
export const FileUploader: React.FC = () => {
  const { notifySuccess, notifyUploadError } = useNotificationHelpers();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) throw new Error('Upload failed');

      setProgress(100);
      notifySuccess('Upload Complete', 'Your file has been uploaded successfully.');
    } catch (error) {
      notifyUploadError();
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
      />

      {isUploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
};

// Example 5: Auto-save with feedback
export const AutoSaveEditor: React.FC = () => {
  const { notifySaved } = useNotificationHelpers();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Debounced auto-save
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (content) {
        setIsSaving(true);
        try {
          await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });
          notifySaved();
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      />
      {isSaving && (
        <p className="text-sm text-gray-500">Saving...</p>
      )}
    </div>
  );
};
