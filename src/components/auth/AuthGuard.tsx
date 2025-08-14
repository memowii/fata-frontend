'use client';

import { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardBody } from '@/components/ui/Card';

/**
 * AuthGuard component props
 */
export interface AuthGuardProps {
  /** Child components to render when authenticated */
  children: React.ReactNode;
  /** URL to redirect to if not authenticated */
  redirectTo?: string;
  /** Whether to require email verification */
  requireEmailVerification?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ReactNode;
  /** Callback when authentication check completes */
  onAuthCheckComplete?: (isAuthenticated: boolean) => void;
}

/**
 * Auth guard component that protects client components
 * Redirects to login if user is not authenticated
 * 
 * @example
 * ```tsx
 * <AuthGuard redirectTo="/login" requireEmailVerification>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export const AuthGuard = memo<AuthGuardProps>(
  ({
    children,
    redirectTo = '/login',
    requireEmailVerification = false,
    loadingComponent,
    unauthorizedComponent,
    onAuthCheckComplete,
  }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        const isAuthorized = isAuthenticated && 
          (!requireEmailVerification || user?.emailVerified);
        
        onAuthCheckComplete?.(isAuthorized);

        if (!isAuthenticated) {
          // Store the current path to redirect back after login
          const currentPath = window.location.pathname;
          const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;
          router.push(redirectUrl);
        } else if (requireEmailVerification && !user?.emailVerified) {
          router.push('/verify-email');
        }
      }
    }, [
      isAuthenticated,
      isLoading,
      user,
      requireEmailVerification,
      router,
      redirectTo,
      onAuthCheckComplete,
    ]);

    // Show loading state
    if (isLoading) {
      return loadingComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" shadow="md">
            <CardBody className="text-center">
              <LoadingSpinner size="xl" className="mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Checking authentication...
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    // Show unauthorized state if not authenticated
    if (!isAuthenticated) {
      return unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" shadow="md">
            <CardBody className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Authentication Required
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Redirecting to login...
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    // Show email verification required state
    if (requireEmailVerification && !user?.emailVerified) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" shadow="md">
            <CardBody className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Email Verification Required
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please verify your email to continue. Redirecting...
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    // Render children if authenticated
    return <>{children}</>;
  }
);

AuthGuard.displayName = 'AuthGuard';