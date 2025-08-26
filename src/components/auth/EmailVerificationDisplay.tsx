'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

/**
 * Email verification states
 */
export type VerificationStatus = 'pending' | 'verifying' | 'success' | 'error' | 'expired';

/**
 * EmailVerificationDisplay component props
 */
export interface EmailVerificationDisplayProps {
  /** Current verification status */
  status: VerificationStatus;
  /** User's email address */
  email?: string;
  /** Error message to display */
  error?: string;
  /** Callback to resend verification email */
  onResend?: () => Promise<void>;
  /** Callback to verify email with token */
  onVerify?: (token: string) => Promise<void>;
  /** Verification token (if available) */
  token?: string;
  /** Whether resend is in progress */
  isResending?: boolean;
  /** Whether to show the login link */
  showLoginLink?: boolean;
}

/**
 * Email verification display component showing verification status
 * 
 * @example
 * ```tsx
 * <EmailVerificationDisplay
 *   status="pending"
 *   email="user@example.com"
 *   onResend={handleResend}
 *   showLoginLink
 * />
 * ```
 */
export const EmailVerificationDisplay = memo<EmailVerificationDisplayProps>(
  ({
    status,
    email,
    error: externalError,
    onResend,
    onVerify,
    token,
    isResending = false,
    showLoginLink = true,
  }) => {
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [resendCount, setResendCount] = useState(0);
    const [lastResendTime, setLastResendTime] = useState<Date | null>(null);

    const canResend = useCallback(() => {
      if (!lastResendTime) return true;
      
      // Allow resend after 60 seconds
      const timeSinceLastResend = Date.now() - lastResendTime.getTime();
      return timeSinceLastResend > 60000;
    }, [lastResendTime]);

    const handleResend = useCallback(async () => {
      if (!onResend || !canResend()) return;

      try {
        setResendError(null);
        setResendSuccess(false);
        
        await onResend();
        
        setResendSuccess(true);
        setResendCount((prev) => prev + 1);
        setLastResendTime(new Date());
        
        // Clear success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      } catch (error) {
        const message = error instanceof Error 
          ? error.message 
          : 'Failed to resend verification email';
        setResendError(message);
      }
    }, [onResend, canResend]);

    const handleDismissError = useCallback(() => {
      setResendError(null);
    }, []);

    const handleDismissSuccess = useCallback(() => {
      setResendSuccess(false);
    }, []);

    // Auto-verify if token is provided and status is pending
    React.useEffect(() => {
      if (token && status === 'pending' && onVerify) {
        onVerify(token);
      }
    }, [token, status, onVerify]);

    const renderContent = () => {
      switch (status) {
        case 'verifying':
          return (
            <div className="text-center py-8">
              <LoadingSpinner size="xl" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Verifying Your Email
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          );

        case 'success':
          return (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
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
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Email Verified Successfully
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your email has been verified. You can now access all features.
              </p>
            </div>
          );

        case 'error':
        case 'expired':
          return (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {status === 'expired' ? 'Verification Link Expired' : 'Verification Failed'}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {status === 'expired'
                  ? 'This verification link has expired. Please request a new one.'
                  : externalError || 'We could not verify your email. Please try again.'}
              </p>
            </div>
          );

        case 'pending':
        default:
          return (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
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
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Verify Your Email
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {email
                  ? `We&apos;ve sent a verification email to ${email}`
                  : 'Please check your email for the verification link'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Can&apos;t find it? Check your spam folder.
              </p>
            </div>
          );
      }
    };

    return (
      <Card padding="lg" shadow="lg" className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Email Verification
          </h2>
        </CardHeader>

        <CardBody className="space-y-4">
          {resendError && (
            <Alert
              variant="error"
              dismissible
              onDismiss={handleDismissError}
            >
              {resendError}
            </Alert>
          )}

          {resendSuccess && (
            <Alert
              variant="success"
              dismissible
              onDismiss={handleDismissSuccess}
            >
              Verification email has been resent successfully!
            </Alert>
          )}

          {renderContent()}
        </CardBody>

        <CardFooter className="space-y-4">
          {(status === 'pending' || status === 'error' || status === 'expired') && onResend && (
            <div className="space-y-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleResend}
                isLoading={isResending}
                loadingText="Resending..."
                disabled={!canResend()}
              >
                Resend Verification Email
              </Button>
              
              {resendCount > 0 && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                  Email resent {resendCount} {resendCount === 1 ? 'time' : 'times'}
                  {!canResend() && ' • Please wait before resending again'}
                </p>
              )}
            </div>
          )}

          {status === 'success' && (
            <Link href="/dashboard" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                Go to Dashboard
              </Button>
            </Link>
          )}

          {showLoginLink && status !== 'verifying' && (
            <div className="flex items-center justify-center space-x-1 text-sm">
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Sign In
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  }
);

EmailVerificationDisplay.displayName = 'EmailVerificationDisplay';