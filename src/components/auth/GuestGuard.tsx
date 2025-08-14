'use client';

import { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardBody } from '@/components/ui/Card';

/**
 * GuestGuard component props
 */
export interface GuestGuardProps {
  /** Child components to render when not authenticated */
  children: React.ReactNode;
  /** URL to redirect to if authenticated */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Callback when authentication check completes */
  onAuthCheckComplete?: (isGuest: boolean) => void;
}

/**
 * Guest guard component that ensures user is not authenticated
 * Redirects to dashboard or specified route if user is authenticated
 * 
 * @example
 * ```tsx
 * <GuestGuard redirectTo="/dashboard">
 *   <LoginForm />
 * </GuestGuard>
 * ```
 */
export const GuestGuard = memo<GuestGuardProps>(
  ({
    children,
    redirectTo = '/dashboard',
    loadingComponent,
    onAuthCheckComplete,
  }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        const isGuest = !isAuthenticated;
        onAuthCheckComplete?.(isGuest);

        if (isAuthenticated) {
          // Check if there's a redirect URL in the query params
          const urlParams = new URLSearchParams(window.location.search);
          const redirectUrl = urlParams.get('redirectTo');
          
          if (redirectUrl && redirectUrl.startsWith('/')) {
            router.push(redirectUrl);
          } else {
            router.push(redirectTo);
          }
        }
      }
    }, [isAuthenticated, isLoading, router, redirectTo, onAuthCheckComplete]);

    // Show loading state
    if (isLoading) {
      return loadingComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" shadow="md">
            <CardBody className="text-center">
              <LoadingSpinner size="xl" className="mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    // Show redirecting state if authenticated
    if (isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" shadow="md">
            <CardBody className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Already Authenticated
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Redirecting to dashboard...
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    // Render children if not authenticated (guest)
    return <>{children}</>;
  }
);

GuestGuard.displayName = 'GuestGuard';