'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
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
  
  return (
    <div className="w-full animate-fade-in">
      <LoginForm
        onSubmit={handleLogin}
        redirectTo={redirectTo}
        showRegisterLink
        showForgotPasswordLink
        error={error || undefined}
        isLoading={isLoading}
      />
    </div>
  );
}