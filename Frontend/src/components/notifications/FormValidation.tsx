import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface FormValidationProps {
  state?: 'error' | 'success' | 'warning' | 'loading';
  message?: string;
  className?: string;
}

export const FormValidation: React.FC<FormValidationProps> = ({ state, message, className = '' }) => {
  if (!state || !message) return null;

  const getIcon = () => {
    switch (state) {
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
    }
  };

  const getTextColor = () => {
    switch (state) {
      case 'error':
        return 'text-rose-600 dark:text-rose-400';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'loading':
        return 'text-cyan-600 dark:text-cyan-400';
    }
  };

  return (
    <div className={`flex items-start gap-2 mt-2 animate-fadeIn ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <p className={`text-sm ${getTextColor()}`}>{message}</p>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  loading?: boolean;
}

export const ValidatedInput: React.FC<InputProps> = ({
  label,
  error,
  success,
  warning,
  loading,
  className = '',
  ...props
}) => {
  const getInputStyles = () => {
    const base = "w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-900 transition-all duration-200";
    
    if (error) {
      return `${base} border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10`;
    }
    if (success) {
      return `${base} border-emerald-300 dark:border-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10`;
    }
    if (warning) {
      return `${base} border-amber-300 dark:border-amber-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10`;
    }
    return `${base} border-gray-200 dark:border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10`;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          className={getInputStyles()}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          </div>
        )}
      </div>
      {error && <FormValidation state="error" message={error} />}
      {success && <FormValidation state="success" message={success} />}
      {warning && <FormValidation state="warning" message={warning} />}
    </div>
  );
};
