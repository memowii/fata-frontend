'use client';

import { useCallback, useState } from 'react';
import { forgotPassword } from '@/lib/auth/client';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { CsrfProtectedForm } from '@/components/security/CsrfProtectedForm';
import type { ForgotPasswordFormData } from '@/lib/types/validation.schemas';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleForgotPassword = useCallback(async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await forgotPassword(data);
      // Success is handled by the form component
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err; // Re-throw to let the form handle it
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleCsrfError = useCallback((error: Error) => {
    console.error('CSRF protection failed on forgot password page:', error);
  }, []);
  
  return (
    <div className="w-full animate-fade-in">
      <CsrfProtectedForm
        showCsrfLoading={false}
        showCsrfError={false}
        onCsrfError={handleCsrfError}
        loadingMessage="Securing password reset form..."
        errorMessage="Password reset security features are temporarily unavailable. Please refresh the page to continue."
      >
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          showLoginLink
          error={error || undefined}
          isLoading={isLoading}
        />
      </CsrfProtectedForm>
    </div>
  );
}