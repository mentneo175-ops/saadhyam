/**
 * API Utility
 * Centralized API client with rate limit handling
 */

import { env } from '../config/env';

export interface RateLimitError {
  error: string;
  message: string;
  detail: string;
  retry_after_seconds: number;
  retry_after_time: string;
  wait_time: string;
  suggestion: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status: number;
  isRateLimitError: boolean;
  rateLimitInfo?: RateLimitError;
}

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  status: number;
  isRateLimitError: boolean;
  rateLimitInfo?: RateLimitError;

  constructor(message: string, status: number, rateLimitInfo?: RateLimitError) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.isRateLimitError = status === 429;
    this.rateLimitInfo = rateLimitInfo;
  }
}

/**
 * Make an API request with automatic rate limit handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${env.apiBaseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle rate limit errors
    if (response.status === 429) {
      const errorData: RateLimitError = await response.json();
      throw new ApiRequestError(
        errorData.message || 'Too many requests',
        429,
        errorData
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiRequestError(
        errorData.detail || errorData.message || 'Request failed',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    // Re-throw ApiRequestError as-is
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiRequestError('Network error. Please check your connection.', 0);
    }

    // Handle other errors
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Upload file with multipart/form-data
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const url = `${env.apiBaseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (response.status === 429) {
      const errorData: RateLimitError = await response.json();
      throw new ApiRequestError(
        errorData.message || 'Too many requests',
        429,
        errorData
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiRequestError(
        errorData.detail || errorData.message || 'Upload failed',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Upload failed',
      0
    );
  }
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  upload: apiUpload,
};
