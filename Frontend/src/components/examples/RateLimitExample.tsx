/**
 * Rate Limit Example Component
 * Demonstrates how to use the rate limiting system
 */

import React, { useState } from 'react';
import { apiPost } from '@/utils/api';
import { useRateLimit } from '@/contexts/RateLimitContext';

export const RateLimitExample: React.FC = () => {
  const { handleApiError, isRateLimited } = useRateLimit();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  /**
   * Example: Make an API call with automatic rate limit handling
   */
  const makeApiCall = async () => {
    setLoading(true);
    setResult('');

    try {
      // Make API request using the utility function
      const response = await apiPost('/api/test-endpoint', {
        message: 'Hello from frontend'
      });

      setResult(`Success: ${JSON.stringify(response)}`);
    } catch (error: any) {
      // handleApiError returns true if it was a rate limit error
      // The modal will be shown automatically
      if (!handleApiError(error)) {
        // Handle other types of errors
        setResult(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example: Test rate limiting by making multiple requests
   */
  const testRateLimit = async () => {
    setResult('Sending 15 requests...');
    
    for (let i = 0; i < 15; i++) {
      try {
        await apiPost('/api/test-endpoint', { index: i });
        setResult(prev => prev + `\n✓ Request ${i + 1} succeeded`);
      } catch (error: any) {
        if (!handleApiError(error)) {
          setResult(prev => prev + `\n✗ Request ${i + 1} failed: ${error.message}`);
        } else {
          setResult(prev => prev + `\n⚠ Request ${i + 1} rate limited`);
          break; // Stop after first rate limit
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Rate Limiting Example
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This component demonstrates how to use the rate limiting system.
          Try clicking the buttons below to see how rate limits work.
        </p>

        {/* Status indicator */}
        {isRateLimited && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-orange-800 dark:text-orange-200 font-medium">
                Rate limited - please wait before making more requests
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={makeApiCall}
            disabled={loading || isRateLimited}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {loading ? 'Loading...' : 'Make API Call'}
          </button>

          <button
            onClick={testRateLimit}
            disabled={loading || isRateLimited}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Test Rate Limit (15 requests)
          </button>
        </div>

        {/* Result display */}
        {result && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Result:
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
              {result}
            </pre>
          </div>
        )}

        {/* Usage instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How it works:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Click "Make API Call" to send a single request</li>
            <li>Click "Test Rate Limit" to send 15 requests quickly</li>
            <li>When rate limited, a modal will appear automatically</li>
            <li>The modal shows when you can retry</li>
            <li>Buttons are disabled while rate limited</li>
          </ul>
        </div>
      </div>

      {/* Code example */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Code Example:
        </h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { apiPost } from '@/utils/api';
import { useRateLimit } from '@/contexts/RateLimitContext';

function MyComponent() {
  const { handleApiError, isRateLimited } = useRateLimit();

  const handleSubmit = async () => {
    try {
      const result = await apiPost('/api/endpoint', data);
      // Handle success
    } catch (error) {
      // Automatically shows modal if rate limited
      if (!handleApiError(error)) {
        // Handle other errors
        console.error(error);
      }
    }
  };

  return (
    <button 
      disabled={isRateLimited} 
      onClick={handleSubmit}
    >
      Submit
    </button>
  );
}`}
        </pre>
      </div>
    </div>
  );
};

export default RateLimitExample;
