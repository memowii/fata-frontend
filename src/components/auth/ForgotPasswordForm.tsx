'use client';

import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/types/validation.schemas';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';

/**
 * ForgotPasswordForm component props
 */
export interface ForgotPasswordFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  /** Whether to show the login link */
  showLoginLink?: boolean;
  /** Custom error message to display */
  error?: string;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
}

/**
 * Forgot password form component for password reset requests
 * 
 * @example
 * ```tsx
 * <ForgotPasswordForm
 *   onSubmit={handleForgotPassword}
 *   showLoginLink
 * />
 * ```
 */
export const ForgotPasswordForm = memo<ForgotPasswordFormProps>(
  ({
    onSubmit,
    showLoginLink = true,
    error: externalError,
    isLoading: externalLoading = false,
  }) => {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setFocus,
      getValues,
    } = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
      mode: 'onTouched',
    });

    const isLoading = externalLoading || isSubmitting;
    const displayError = externalError || submitError;

    const handleFormSubmit = useCallback(
      async (data: ForgotPasswordFormData) => {
        try {
          setSubmitError(null);
          setSuccessMessage(null);
          
          await onSubmit(data);
          
          // Show success message
          setIsSubmitted(true);
          setSuccessMessage(
            `Password reset instructions have been sent to ${data.email}. Please check your inbox and spam folder.`
          );
        } catch (error) {
          const message = error instanceof Error 
            ? error.message 
            : 'An error occurred while processing your request';
          setSubmitError(message);
          setFocus('email');
        }
      },
      [onSubmit, setFocus]
    );

    const handleDismissError = useCallback(() => {
      setSubmitError(null);
    }, []);

    const handleDismissSuccess = useCallback(() => {
      setSuccessMessage(null);
    }, []);

    const handleResend = useCallback(async () => {
      const email = getValues('email');
      if (email) {
        await handleFormSubmit({ email });
      }
    }, [getValues, handleFormSubmit]);

    return (
      <Card padding="lg" shadow="none" className="w-full max-w-md mx-auto" glass>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-6">
          <CardHeader>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you instructions to reset your password
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

            {successMessage && (
              <Alert
                variant="success"
                dismissible
                onDismiss={handleDismissSuccess}
              >
                {successMessage}
              </Alert>
            )}

            {!isSubmitted ? (
              <>
                <FormInput
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  helperText="Enter the email address associated with your account"
                  leftAddon={
                    <svg
                      className="h-5 w-5"
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
                  }
                />
              </>
            ) : (
              <div className="text-center py-4 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 backdrop-blur-sm animate-scale-in">
                  <svg
                    className="h-8 w-8 text-success"
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
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ve sent password reset instructions to your email address.
                </p>
              </div>
            )}
          </CardBody>

          <CardFooter className="space-y-4">
            {!isSubmitted ? (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                loadingText="Sending instructions..."
              >
                Send Reset Instructions
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive the email?
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleResend}
                  isLoading={isLoading}
                  loadingText="Resending..."
                >
                  Resend Email
                </Button>
              </div>
            )}

            {showLoginLink && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/50 px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}
            
            {showLoginLink && (
              <div className="flex items-center justify-center space-x-1 text-sm">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors duration-200 hover:underline underline-offset-4 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    );
  }
);

ForgotPasswordForm.displayName = 'ForgotPasswordForm';