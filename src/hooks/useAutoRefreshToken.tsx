/**
 * Auto Token Refresh Hook
 * Automatically refreshes authentication tokens before they expire
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRefreshToken } from '@/hooks/queries';
import { tokenManager } from '@/lib/api/client';

interface UseAutoRefreshTokenOptions {
  /**
   * Time before expiry to trigger refresh (in milliseconds)
   * Default: 60000 (1 minute)
   */
  refreshBeforeExpiry?: number;
  /**
   * Whether to enable auto refresh
   * Default: true
   */
  enabled?: boolean;
  /**
   * Callback when refresh succeeds
   */
  onRefreshSuccess?: () => void;
  /**
   * Callback when refresh fails
   */
  onRefreshError?: (error: unknown) => void;
}

/**
 * Hook for automatic token refresh
 */
export function useAutoRefreshToken(options: UseAutoRefreshTokenOptions = {}) {
  const {
    refreshBeforeExpiry = 60000, // 1 minute before expiry
    enabled = true,
    onRefreshSuccess,
    onRefreshError,
  } = options;

  const queryClient = useQueryClient();
  const refreshMutation = useRefreshToken();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const scheduleRefresh = () => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const expiry = tokenManager.getTokenExpiry();
      const refreshToken = tokenManager.getRefreshToken();

      if (!expiry || !refreshToken) {
        // No tokens to refresh
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      const refreshTime = timeUntilExpiry - refreshBeforeExpiry;

      if (refreshTime <= 0) {
        // Token is already expired or about to expire
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;
          refreshMutation.mutate(undefined, {
            onSuccess: () => {
              isRefreshingRef.current = false;
              onRefreshSuccess?.();
              // Reschedule for the new token
              scheduleRefresh();
            },
            onError: (error) => {
              isRefreshingRef.current = false;
              onRefreshError?.(error);
            },
          });
        }
      } else {
        // Schedule refresh
        timeoutRef.current = setTimeout(() => {
          if (!isRefreshingRef.current) {
            isRefreshingRef.current = true;
            refreshMutation.mutate(undefined, {
              onSuccess: () => {
                isRefreshingRef.current = false;
                onRefreshSuccess?.();
                // Reschedule for the new token
                scheduleRefresh();
              },
              onError: (error) => {
                isRefreshingRef.current = false;
                onRefreshError?.(error);
              },
            });
          }
        }, refreshTime);
      }
    };

    // Initial schedule
    scheduleRefresh();

    // Listen for storage events (token changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'token_expiry') {
        scheduleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for focus events (refresh when tab becomes active)
    const handleFocus = () => {
      if (tokenManager.isTokenExpired()) {
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;
          refreshMutation.mutate(undefined, {
            onSuccess: () => {
              isRefreshingRef.current = false;
              onRefreshSuccess?.();
              scheduleRefresh();
            },
            onError: (error) => {
              isRefreshingRef.current = false;
              onRefreshError?.(error);
            },
          });
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, refreshBeforeExpiry, refreshMutation, onRefreshSuccess, onRefreshError]);

  return {
    isRefreshing: refreshMutation.isPending,
    refresh: () => refreshMutation.mutate(),
    error: refreshMutation.error,
  };
}

/**
 * Provider component for auto token refresh
 */
export function AutoRefreshTokenProvider({ children }: { children: React.ReactNode }) {
  useAutoRefreshToken({
    enabled: true,
    refreshBeforeExpiry: 60000, // 1 minute
    onRefreshSuccess: () => {
      console.log('Token refreshed successfully');
    },
    onRefreshError: (error) => {
      console.error('Token refresh failed:', error);
    },
  });

  return <>{children}</>;
}