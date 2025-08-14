/**
 * Error Handling Utilities
 * Comprehensive error handling for API requests
 */

import { AxiosError } from 'axios';
import type { ApiError, ApiResponse, ApiErrorCode } from '@/lib/types/api.types';

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: Record<string, unknown>;
  public isNetworkError: boolean;
  public isServerError: boolean;
  public isClientError: boolean;
  public isAuthError: boolean;

  constructor(error: AxiosError<ApiResponse>) {
    const apiError = error.response?.data?.error;
    const message = apiError?.message || error.message || 'An unexpected error occurred';
    
    super(message);
    
    this.name = 'ApiRequestError';
    this.code = apiError?.code || 'UNKNOWN_ERROR';
    this.statusCode = error.response?.status;
    this.details = apiError?.details;
    
    // Categorize error
    this.isNetworkError = !error.response;
    this.isServerError = !!this.statusCode && this.statusCode >= 500;
    this.isClientError = !!this.statusCode && this.statusCode >= 400 && this.statusCode < 500;
    this.isAuthError = this.statusCode === 401 || this.statusCode === 403;
  }
}

/**
 * Error message map for user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'The provided data is invalid.',
  
  // Resource errors
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  
  // Server errors
  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable.',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }
  
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiResponse;
    const code = apiError?.error?.code;
    
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    
    return apiError?.error?.message || error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Extract validation errors from API response
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string[]> | null {
  if (error instanceof AxiosError) {
    const details = error.response?.data?.error?.details;
    
    if (details && typeof details === 'object' && 'validation' in details) {
      return details.validation as Record<string, string[]>;
    }
  }
  
  return null;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    // Don't retry client errors (4xx)
    if (error.isClientError && error.statusCode !== 429) {
      return false;
    }
    
    // Retry network errors and server errors
    return error.isNetworkError || error.isServerError;
  }
  
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    
    // Don't retry 4xx errors except rate limiting
    if (status && status >= 400 && status < 500 && status !== 429) {
      return false;
    }
    
    // Retry network errors and 5xx errors
    return !error.response || (status ? status >= 500 : false);
  }
  
  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  baseDelay = 1000,
  maxDelay = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Error logger for development
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group(`Error${context ? ` in ${context}` : ''}`);
  
  if (error instanceof ApiRequestError) {
    console.error('Type:', 'API Request Error');
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Categories:', {
      network: error.isNetworkError,
      server: error.isServerError,
      client: error.isClientError,
      auth: error.isAuthError,
    });
  } else if (error instanceof AxiosError) {
    console.error('Type:', 'Axios Error');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
  } else if (error instanceof Error) {
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } else {
    console.error('Unknown error:', error);
  }
  
  console.groupEnd();
}

/**
 * Create error handler for mutations
 */
export function createMutationErrorHandler(
  options?: {
    showToast?: boolean;
    logErrors?: boolean;
    onError?: (error: unknown) => void;
  }
) {
  return (error: unknown) => {
    if (options?.logErrors !== false) {
      logError(error, 'Mutation');
    }
    
    if (options?.showToast !== false) {
      const message = getUserFriendlyMessage(error);
      // You can integrate with your toast library here
      console.error('Toast:', message);
    }
    
    options?.onError?.(error);
  };
}

/**
 * Create error handler for queries
 */
export function createQueryErrorHandler(
  options?: {
    showToast?: boolean;
    logErrors?: boolean;
    onError?: (error: unknown) => void;
  }
) {
  return (error: unknown) => {
    if (options?.logErrors !== false) {
      logError(error, 'Query');
    }
    
    // Don't show toast for auth errors (handled by interceptor)
    if (error instanceof ApiRequestError && error.isAuthError) {
      return;
    }
    
    if (options?.showToast !== false) {
      const message = getUserFriendlyMessage(error);
      // You can integrate with your toast library here
      console.error('Toast:', message);
    }
    
    options?.onError?.(error);
  };
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Parse error for display
 */
export function parseErrorForDisplay(error: unknown): {
  title: string;
  message: string;
  details?: string;
  isRetryable: boolean;
} {
  const message = getUserFriendlyMessage(error);
  const isRetryable = isRetryableError(error);
  
  if (error instanceof ApiRequestError) {
    if (error.isNetworkError) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server.',
        details: 'Please check your internet connection and try again.',
        isRetryable: true,
      };
    }
    
    if (error.isServerError) {
      return {
        title: 'Server Error',
        message: message,
        details: `Error code: ${error.statusCode}`,
        isRetryable: true,
      };
    }
    
    if (error.isAuthError) {
      return {
        title: 'Authentication Required',
        message: message,
        isRetryable: false,
      };
    }
  }
  
  return {
    title: 'Error',
    message: message,
    isRetryable,
  };
}