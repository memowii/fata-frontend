'use client';

import { memo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

/**
 * SessionManager component props
 */
export interface SessionManagerProps {
  /** Child components */
  children: React.ReactNode;
  /** Time before token expiry to refresh (in milliseconds) */
  refreshBeforeExpiry?: number;
  /** Whether to show session expiry warnings */
  showExpiryWarning?: boolean;
  /** Time before expiry to show warning (in milliseconds) */
  warningBeforeExpiry?: number;
  /** Callback when session expires */
  onSessionExpired?: () => void;
  /** Callback when session is refreshed */
  onSessionRefreshed?: () => void;
  /** Whether to auto-logout on session expiry */
  autoLogoutOnExpiry?: boolean;
}

/**
 * Session manager component that handles token refresh and session management
 * 
 * @example
 * ```tsx
 * <SessionManager
 *   refreshBeforeExpiry={5 * 60 * 1000} // 5 minutes
 *   showExpiryWarning
 *   autoLogoutOnExpiry
 * >
 *   <App />
 * </SessionManager>
 * ```
 */
export const SessionManager = memo<SessionManagerProps>(
  ({
    children,
    refreshBeforeExpiry = 5 * 60 * 1000, // 5 minutes before expiry
    showExpiryWarning = true,
    warningBeforeExpiry = 2 * 60 * 1000, // 2 minutes before expiry
    onSessionExpired,
    onSessionRefreshed,
    autoLogoutOnExpiry = true,
  }) => {
    const { isAuthenticated, logout, refreshAuth } = useAuth();
    const { startTokenRefresh, stopTokenRefresh } = useTokenRefresh();
    const [showWarning, setShowWarning] = React.useState(false);
    const [timeUntilExpiry, setTimeUntilExpiry] = React.useState<number | null>(null);
    const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Parse token expiry time
    const getTokenExpiryTime = useCallback((): number | null => {
      const tokenString = localStorage.getItem('accessToken');
      if (!tokenString) return null;

      try {
        // Decode JWT token to get expiry
        const [, payload] = tokenString.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.exp ? decodedPayload.exp * 1000 : null;
      } catch {
        return null;
      }
    }, []);

    // Handle session refresh
    const handleRefresh = useCallback(async () => {
      try {
        await refreshAuth();
        setShowWarning(false);
        setTimeUntilExpiry(null);
        onSessionRefreshed?.();
      } catch (error) {
        console.error('Failed to refresh session:', error);
        if (autoLogoutOnExpiry) {
          await logout();
        }
        onSessionExpired?.();
      }
    }, [refreshAuth, logout, autoLogoutOnExpiry, onSessionExpired, onSessionRefreshed]);

    // Handle manual refresh request
    const handleManualRefresh = useCallback(() => {
      handleRefresh();
    }, [handleRefresh]);

    // Setup session monitoring
    useEffect(() => {
      if (!isAuthenticated) {
        // Clear all timers if not authenticated
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setShowWarning(false);
        setTimeUntilExpiry(null);
        return;
      }

      const setupTimers = () => {
        // Clear existing timers
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        const expiryTime = getTokenExpiryTime();
        if (!expiryTime) return;

        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry <= 0) {
          // Token already expired
          if (autoLogoutOnExpiry) {
            logout();
          }
          onSessionExpired?.();
          return;
        }

        // Set up automatic refresh
        const refreshTime = timeUntilExpiry - refreshBeforeExpiry;
        if (refreshTime > 0) {
          expiryTimerRef.current = setTimeout(() => {
            handleRefresh();
          }, refreshTime);
        }

        // Set up warning display
        if (showExpiryWarning) {
          const warningTime = timeUntilExpiry - warningBeforeExpiry;
          if (warningTime > 0) {
            warningTimerRef.current = setTimeout(() => {
              setShowWarning(true);
              
              // Start countdown timer
              countdownTimerRef.current = setInterval(() => {
                const remaining = getTokenExpiryTime();
                if (remaining) {
                  const timeLeft = Math.max(0, remaining - Date.now());
                  setTimeUntilExpiry(timeLeft);
                  
                  if (timeLeft === 0) {
                    clearInterval(countdownTimerRef.current!);
                    if (autoLogoutOnExpiry) {
                      logout();
                    }
                    onSessionExpired?.();
                  }
                }
              }, 1000);
            }, warningTime);
          }
        }
      };

      // Initial setup
      setupTimers();

      // Start automatic token refresh
      startTokenRefresh();

      // Re-setup timers when token changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'accessToken') {
          setupTimers();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        stopTokenRefresh();
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [
      isAuthenticated,
      refreshBeforeExpiry,
      showExpiryWarning,
      warningBeforeExpiry,
      autoLogoutOnExpiry,
      getTokenExpiryTime,
      handleRefresh,
      logout,
      onSessionExpired,
      startTokenRefresh,
      stopTokenRefresh,
    ]);

    // Format time for display
    const formatTime = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      return `${seconds} seconds`;
    };

    return (
      <>
        {showWarning && timeUntilExpiry !== null && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <Alert
              variant="warning"
              title="Session Expiring Soon"
              dismissible
              onDismiss={() => setShowWarning(false)}
            >
              <p className="mb-2">
                Your session will expire in{' '}
                <span className="font-semibold">{formatTime(timeUntilExpiry)}</span>.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleManualRefresh}
              >
                Extend Session
              </Button>
            </Alert>
          </div>
        )}
        {children}
      </>
    );
  }
);

SessionManager.displayName = 'SessionManager';