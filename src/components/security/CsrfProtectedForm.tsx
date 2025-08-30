'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useCsrfToken, useCsrfProtectionStatus } from '@/hooks/useCsrfToken';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export interface CsrfProtectedFormProps {
  /** Form content */
  children: ReactNode;
  /** Whether to show CSRF loading state */
  showCsrfLoading?: boolean;
  /** Whether to show CSRF error state */
  showCsrfError?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback when CSRF protection fails */
  onCsrfError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Wrapper component that ensures CSRF protection is available before rendering forms
 * 
 * @example
 * ```tsx
 * <CsrfProtectedForm showCsrfLoading showCsrfError>
 *   <LoginForm onSubmit={handleSubmit} />
 * </CsrfProtectedForm>
 * ```
 */
export function CsrfProtectedForm({
  children,
  showCsrfLoading = false,
  showCsrfError = false,
  loadingMessage = 'Securing form...',
  errorMessage = 'Security features are temporarily unavailable. Please refresh the page.',
  onCsrfError,
  className = '',
}: CsrfProtectedFormProps) {
  const { isChecking, hasFailed } = useCsrfProtectionStatus();
  const { error: csrfError, refreshToken } = useCsrfToken();

  useEffect(() => {
    if (hasFailed && csrfError && onCsrfError) {
      onCsrfError(csrfError);
    }
  }, [hasFailed, csrfError, onCsrfError]);

  const handleRetry = useCallback(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Failed to retry CSRF token fetch:', error);
    }
  }, [refreshToken]);

  // Show loading state while checking CSRF protection
  if (isChecking && showCsrfLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  // Show error state if CSRF protection failed
  if (hasFailed && showCsrfError) {
    return (
      <div className={className}>
        <Alert variant="error" className="mb-4">
          <div className="flex flex-col space-y-3">
            <p>{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="w-fit"
            >
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Render children normally (CSRF token will be handled automatically by API client)
  return <div className={className}>{children}</div>;
}

/**
 * Hook to check if a form should be disabled due to CSRF issues
 */
export function useCsrfFormState() {
  const { isAvailable, isChecking, hasFailed } = useCsrfProtectionStatus();
  const { refreshToken } = useCsrfToken();

  const [isRetrying, setIsRetrying] = useState(false);

  const retryProtection = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      await refreshToken();
    } catch (error) {
      console.error('Failed to retry CSRF protection:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [refreshToken, isRetrying]);

  return {
    /** Whether the form should be disabled due to CSRF issues */
    shouldDisableForm: !isAvailable || isChecking || hasFailed,
    /** Whether CSRF protection is still being initialized */
    isInitializing: isChecking,
    /** Whether CSRF protection has failed */
    hasProtectionFailed: hasFailed,
    /** Whether currently retrying CSRF protection */
    isRetrying,
    /** Function to retry CSRF protection */
    retryProtection,
  };
}

/**
 * Component that displays CSRF protection status
 */
export function CsrfStatus() {
  const { isAvailable, isChecking, hasFailed } = useCsrfProtectionStatus();

  if (isChecking) {
    return (
      <div className="flex items-center text-xs text-muted-foreground">
        <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
        Initializing security...
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="flex items-center text-xs text-destructive">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
        Security unavailable
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="flex items-center text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        Secured
      </div>
    );
  }

  return null;
}