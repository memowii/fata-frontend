'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { CsrfProtectedForm } from '@/components/security/CsrfProtectedForm';
import type { LoginFormData } from '@/lib/types/validation.schemas';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useAuth();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  const handleLogin = useCallback(async (data: LoginFormData) => {
    const result = await login(data);
    // Navigation and error handling are managed by the auth context
    // No need to throw or catch here
  }, [login]);
  
  const handleCsrfError = useCallback((error: Error) => {
    console.error('CSRF protection failed on login page:', error);
  }, []);
  
  return (
    <div className="w-full animate-fade-in">
      <CsrfProtectedForm
        showCsrfLoading={false}
        showCsrfError={false}
        onCsrfError={handleCsrfError}
        loadingMessage="Securing login form..."
        errorMessage="Login security features are temporarily unavailable. Please refresh the page to continue."
      >
        <LoginForm
          onSubmit={handleLogin}
          redirectTo={redirectTo}
          showRegisterLink
          showForgotPasswordLink
          error={error || undefined}
          isLoading={isLoading}
        />
      </CsrfProtectedForm>
    </div>
  );
}