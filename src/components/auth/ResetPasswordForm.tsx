'use client';

import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/types/validation.schemas';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import Link from 'next/link';

/**
 * ResetPasswordForm component props
 */
export interface ResetPasswordFormProps {
  /** Reset token from the URL */
  token: string;
  /** Callback when form is submitted successfully */
  onSubmit: (data: Omit<ResetPasswordFormData, 'confirmPassword'>) => Promise<void>;
  /** Whether to show the login link */
  showLoginLink?: boolean;
  /** Custom error message to display */
  error?: string;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  /** Whether to show password strength indicator */
  showPasswordStrength?: boolean;
}

/**
 * Reset password form component for setting a new password
 * 
 * @example
 * ```tsx
 * <ResetPasswordForm
 *   token={resetToken}
 *   onSubmit={handleResetPassword}
 *   showLoginLink
 *   showPasswordStrength
 * />
 * ```
 */
export const ResetPasswordForm = memo<ResetPasswordFormProps>(
  ({
    token,
    onSubmit,
    showLoginLink = true,
    error: externalError,
    isLoading: externalLoading = false,
    showPasswordStrength = true,
  }) => {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      watch,
      setFocus,
    } = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
      mode: 'onTouched',
      defaultValues: {
        token,
      },
    });

    const newPassword = watch('newPassword', '');
    const isLoading = externalLoading || isSubmitting;
    const displayError = externalError || submitError;

    const handleFormSubmit = useCallback(
      async (data: ResetPasswordFormData) => {
        try {
          setSubmitError(null);
          
          // Remove confirmPassword before sending to API
          const { confirmPassword, ...submitData } = data;
          await onSubmit(submitData);
          
          // Show success state
          setIsSuccess(true);
        } catch (error) {
          const message = error instanceof Error 
            ? error.message 
            : 'An error occurred while resetting your password';
          setSubmitError(message);
          setFocus('newPassword');
        }
      },
      [onSubmit, setFocus]
    );

    const handleDismissError = useCallback(() => {
      setSubmitError(null);
    }, []);

    if (isSuccess) {
      return (
        <Card padding="lg" shadow="lg" className="w-full max-w-md mx-auto">
          <CardBody className="text-center py-8">
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
              Password Reset Successfully
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
          </CardBody>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                Go to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card padding="lg" shadow="lg" className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <CardHeader>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Please enter your new password below. Make sure it&apos;s strong and secure.
            </p>
          </CardHeader>

          <CardBody className="space-y-4">
            {displayError && (
              <Alert
                variant="error"
                dismissible
                onDismiss={handleDismissError}
              >
                {displayError}
              </Alert>
            )}

            <input type="hidden" {...register('token')} />

            <div className="space-y-2">
              <PasswordInput
                {...register('newPassword')}
                label="New Password"
                placeholder="Enter your new password"
                error={errors.newPassword?.message}
                autoComplete="new-password"
                required
                disabled={isLoading}
                leftAddon={
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                }
              />
              
              {showPasswordStrength && newPassword && (
                <PasswordStrengthIndicator
                  password={newPassword}
                  showFeedback
                  showLabel
                />
              )}
            </div>

            <PasswordInput
              {...register('confirmPassword')}
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              required
              disabled={isLoading}
              leftAddon={
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
            />

            <Alert variant="info" showIcon>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Password must be at least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </Alert>
          </CardBody>

          <CardFooter className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="Resetting password..."
            >
              Reset Password
            </Button>

            {showLoginLink && (
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
        </form>
      </Card>
    );
  }
);

ResetPasswordForm.displayName = 'ResetPasswordForm';