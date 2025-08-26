'use client';

import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/types/validation.schemas';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';

/**
 * LoginForm component props
 */
export interface LoginFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: LoginFormData) => Promise<void>;
  /** Optional redirect URL after successful login */
  redirectTo?: string;
  /** Whether to show the registration link */
  showRegisterLink?: boolean;
  /** Whether to show the forgot password link */
  showForgotPasswordLink?: boolean;
  /** Custom error message to display */
  error?: string;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
}

/**
 * Login form component with email/password authentication
 * 
 * @example
 * ```tsx
 * <LoginForm
 *   onSubmit={handleLogin}
 *   showRegisterLink
 *   showForgotPasswordLink
 * />
 * ```
 */
export const LoginForm = memo<LoginFormProps>(
  ({
    onSubmit,
    redirectTo,
    showRegisterLink = true,
    showForgotPasswordLink = true,
    error: externalError,
    isLoading: externalLoading = false,
  }) => {
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setFocus,
    } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      mode: 'onTouched',
    });

    const isLoading = externalLoading || isSubmitting;
    const displayError = externalError || submitError;

    const handleFormSubmit = useCallback(
      async (data: LoginFormData) => {
        setSubmitError(null);
        
        await onSubmit(data);
        // Errors are now handled by the auth context through the error prop
      },
      [onSubmit]
    );

    const handleDismissError = useCallback(() => {
      setSubmitError(null);
    }, []);

    return (
      <Card padding="lg" shadow="none" className="w-full max-w-md mx-auto" glass>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-6">
          <CardHeader>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Sign in to continue to your account
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

            <FormInput
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
              required
              disabled={isLoading}
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
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />

            <PasswordInput
              {...register('password')}
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              autoComplete="current-password"
              required
              disabled={isLoading}
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />

            {showForgotPasswordLink && (
              <div className="text-right">
                <Link
                  href={'/forgot-password'}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </CardBody>

          <CardFooter className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>

            {showRegisterLink && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/50 px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}
            
            {showRegisterLink && (
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href={'/register'}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors duration-200 hover:underline underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            )}

            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}
          </CardFooter>
        </form>
      </Card>
    );
  }
);

LoginForm.displayName = 'LoginForm';