'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * Hook to require authentication for a component
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);
  
  return { isAuthenticated, isLoading };
}