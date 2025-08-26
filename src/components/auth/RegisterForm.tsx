'use client';

import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/types/validation.schemas';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import Link from 'next/link';

/**
 * RegisterForm component props
 */
export interface RegisterFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: Omit<RegisterFormData, 'confirmPassword'>) => Promise<void>;
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
 * Registration form component with name, email, and password fields
 * 
 * @example
 * ```tsx
 * <RegisterForm
 *   onSubmit={handleRegister}
 *   showLoginLink
 *   showPasswordStrength
 * />
 * ```
 */
export const RegisterForm = memo<RegisterFormProps>(
  ({
    onSubmit,
    showLoginLink = true,
    error: externalError,
    isLoading: externalLoading = false,
    showPasswordStrength = true,
  }) => {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      watch,
      setFocus,
    } = useForm<RegisterFormData>({
      resolver: zodResolver(registerSchema),
      mode: 'onTouched',
    });

    const password = watch('password', '');
    const isLoading = externalLoading || isSubmitting;
    const displayError = externalError || submitError;

    const handleFormSubmit = useCallback(
      async (data: RegisterFormData) => {
        if (!acceptTerms) {
          setSubmitError('You must accept the terms and conditions');
          return;
        }

        setSubmitError(null);
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...submitData } = data;
        
        // Clean up the name by removing extra spaces
        const cleanedData = {
          ...submitData,
          name: submitData.name.trim().replace(/\s+/g, ' ')
        };
        
        await onSubmit(cleanedData);
        // Errors are now handled by the auth context through the error prop
      },
      [onSubmit, acceptTerms]
    );

    const handleDismissError = useCallback(() => {
      setSubmitError(null);
    }, []);

    return (
      <Card padding="lg" shadow="none" className="w-full max-w-md mx-auto" glass>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-6">
          <CardHeader>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Join us today and start your journey
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground/80">
              📧 You&apos;ll need to verify your email to activate your account
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
              {...register('name')}
              type="text"
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              autoComplete="name"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            <div className="space-y-2">
              <PasswordInput
                {...register('password')}
                label="Password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                autoComplete="new-password"
                required
                disabled={isLoading}
                helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (only @$!%*?& allowed)"
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
              
              {showPasswordStrength && password && (
                <PasswordStrengthIndicator
                  password={password}
                  showFeedback
                  showLabel
                />
              )}
            </div>

            <PasswordInput
              {...register('confirmPassword')}
              label="Confirm Password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
            />

            <div className="flex items-start">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-all duration-200"
                aria-describedby="terms-description"
              />
              <label
                htmlFor="accept-terms"
                className="ml-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                id="terms-description"
              >
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
          </CardBody>

          <CardFooter className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="Creating account..."
              disabled={!acceptTerms}
            >
              Create Account
            </Button>

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
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors duration-200 hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    );
  }
);

RegisterForm.displayName = 'RegisterForm';