'use client';

import { useCallback, useState } from 'react';
import { forgotPassword } from '@/lib/auth/client';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
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
  
  return (
    <div className="w-full animate-fade-in">
      <ForgotPasswordForm
        onSubmit={handleForgotPassword}
        showLoginLink
        error={error || undefined}
        isLoading={isLoading}
      />
    </div>
  );
}