'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
import type { RegisterFormData } from '@/lib/types/validation.schemas';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();
  
  const handleRegister = useCallback(async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
    const result = await register(data);
    // Navigation and error handling are managed by the auth context
    // No need to throw or catch here
  }, [register]);
  
  return (
    <div className="w-full animate-fade-in">
      <RegisterForm
        onSubmit={handleRegister}
        showLoginLink
        showPasswordStrength
        error={error || undefined}
        isLoading={isLoading}
      />
    </div>
  );
}