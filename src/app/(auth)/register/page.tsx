'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { CsrfProtectedForm } from '@/components/security/CsrfProtectedForm';
import type { RegisterFormData } from '@/lib/types/validation.schemas';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();
  
  const handleRegister = useCallback(async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
    const result = await register(data);
    // Navigation and error handling are managed by the auth context
    // No need to throw or catch here
  }, [register]);
  
  const handleCsrfError = useCallback((error: Error) => {
    console.error('CSRF protection failed on register page:', error);
  }, []);
  
  return (
    <div className="w-full animate-fade-in">
      <CsrfProtectedForm
        showCsrfLoading={false}
        showCsrfError={false}
        onCsrfError={handleCsrfError}
        loadingMessage="Securing registration form..."
        errorMessage="Registration security features are temporarily unavailable. Please refresh the page to continue."
      >
        <RegisterForm
          onSubmit={handleRegister}
          showLoginLink
          showPasswordStrength
          error={error || undefined}
          isLoading={isLoading}
        />
      </CsrfProtectedForm>
    </div>
  );
}