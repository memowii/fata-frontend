'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { queryKeys } from '@/lib/query/query-keys';
// import { api } from '@/lib/api/client';
import type { CsrfTokenResponse, ApiResponse } from '@/lib/types/api.types';

/**
 * CSRF token cache duration in milliseconds
 * Tokens should be refreshed before they expire
 */
const CSRF_TOKEN_STALE_TIME = 30 * 60 * 1000; // 30 minutes
const CSRF_TOKEN_CACHE_TIME = 60 * 60 * 1000; // 60 minutes

/**
 * Fetches CSRF token from our Next.js API route
 */
async function fetchCsrfToken(): Promise<CsrfTokenResponse> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: Failed to fetch CSRF token`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use the status message
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data: ApiResponse<CsrfTokenResponse> = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Invalid CSRF token response format');
    }

    return data.data;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Options for the CSRF token hook
 */
export interface UseCsrfTokenOptions {
  /** Whether to automatically fetch the token on mount */
  enabled?: boolean;
  /** Custom stale time for the token cache */
  staleTime?: number;
  /** Custom cache time for the token */
  cacheTime?: number;
  /** Callback when token fetch succeeds */
  onSuccess?: (data: CsrfTokenResponse) => void;
  /** Callback when token fetch fails */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing CSRF tokens with automatic caching and refresh
 * 
 * @example
 * ```tsx
 * const { csrfToken, isLoading, error, refreshToken } = useCsrfToken();
 * 
 * // Use in a form submission
 * const handleSubmit = async (formData) => {
 *   if (!csrfToken) {
 *     await refreshToken();
 *   }
 *   // Submit form with CSRF token
 * };
 * ```
 */
export function useCsrfToken(options: UseCsrfTokenOptions = {}) {
  const {
    enabled = process.env.NEXT_PUBLIC_ENABLE_CSRF === 'true', // Controlled by environment variable
    staleTime = CSRF_TOKEN_STALE_TIME,
    cacheTime = CSRF_TOKEN_CACHE_TIME,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();
  const refreshPromiseRef = useRef<Promise<CsrfTokenResponse> | null>(null);

  const {
    data: tokenData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.security.csrfToken(),
    queryFn: fetchCsrfToken,
    enabled,
    staleTime,
    gcTime: cacheTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  });

  // Handle success/error callbacks using useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    if (tokenData && onSuccess) {
      onSuccess(tokenData);
    }
  }, [tokenData, onSuccess]);

  useEffect(() => {
    if (error && onError) {
      console.error('CSRF token fetch failed:', error);
      onError(error as Error);
    }
  }, [error, onError]);

  /**
   * Get the current CSRF token value
   */
  const csrfToken = tokenData?.csrfToken || null;

  /**
   * Check if the token is expired
   */
  const isTokenExpired = useCallback((): boolean => {
    if (!tokenData?.expiresAt) return false;
    
    try {
      const expiryTime = new Date(tokenData.expiresAt).getTime();
      const currentTime = Date.now();
      // Consider expired if expires within 1 minute
      return currentTime >= (expiryTime - 60000);
    } catch {
      return false; // If we can't parse the date, assume it's not expired
    }
  }, [tokenData?.expiresAt]);

  /**
   * Manually refresh the CSRF token
   * Prevents multiple simultaneous refresh requests
   */
  const refreshToken = useCallback(async (): Promise<CsrfTokenResponse> => {
    // Return existing promise if refresh is already in progress
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Create new refresh promise
    const refreshPromise = (async () => {
      try {
        const result = await refetch();
        if (result.data) {
          return result.data;
        }
        throw new Error('Failed to refresh CSRF token');
      } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
      } finally {
        // Clear the promise reference
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [refetch]);

  /**
   * Get a valid CSRF token, refreshing if necessary
   */
  const getValidToken = useCallback(async (): Promise<string> => {
    // If we have a valid token that's not expired, return it
    if (csrfToken && !isTokenExpired()) {
      return csrfToken;
    }

    // Otherwise, refresh and return the new token
    const newTokenData = await refreshToken();
    return newTokenData.csrfToken;
  }, [csrfToken, isTokenExpired, refreshToken]);

  /**
   * Invalidate the CSRF token cache
   */
  const invalidateToken = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.security.csrfToken(),
    });
  }, [queryClient]);

  /**
   * Clear the CSRF token from cache
   */
  const clearToken = useCallback(() => {
    queryClient.removeQueries({
      queryKey: queryKeys.security.csrfToken(),
    });
  }, [queryClient]);

  return {
    /** The current CSRF token */
    csrfToken,
    /** Whether the token is currently being loaded */
    isLoading,
    /** Whether there was an error fetching the token */
    isError,
    /** The error object if token fetch failed */
    error: error as Error | null,
    /** Whether the token is currently being refreshed */
    isRefreshing: false,
    /** Whether the current token is expired */
    isExpired: isTokenExpired(),
    /** Manually refresh the CSRF token */
    refreshToken,
    /** Get a valid token, refreshing if necessary */
    getValidToken,
    /** Invalidate the token cache (will trigger refetch) */
    invalidateToken,
    /** Clear the token from cache */
    clearToken,
  };
}

/**
 * Helper hook to get CSRF token with automatic refresh for form submissions
 * 
 * @example
 * ```tsx
 * const getCsrfToken = useCsrfTokenForSubmit();
 * 
 * const handleSubmit = async (formData) => {
 *   const token = await getCsrfToken();
 *   // Submit form with token
 * };
 * ```
 */
export function useCsrfTokenForSubmit() {
  const { getValidToken } = useCsrfToken();
  
  return useCallback(async (): Promise<string> => {
    try {
      return await getValidToken();
    } catch (error) {
      console.error('Failed to get CSRF token for form submission:', error);
      throw new Error('Unable to secure form submission. Please refresh the page and try again.');
    }
  }, [getValidToken]);
}

/**
 * Hook to check if CSRF protection is available
 * Useful for conditional rendering or feature flags
 */
export function useCsrfProtectionStatus() {
  const { csrfToken, isLoading, isError } = useCsrfToken(); // Use default enabled setting

  return {
    /** Whether CSRF protection is available */
    isAvailable: Boolean(csrfToken && !isError),
    /** Whether we're still checking CSRF availability */
    isChecking: isLoading,
    /** Whether CSRF protection failed to initialize */
    hasFailed: isError,
  };
}