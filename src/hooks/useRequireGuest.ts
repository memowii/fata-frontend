'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * Hook to require guest (not authenticated) status for a component
 * Redirects to dashboard if authenticated
 */
export function useRequireGuest(redirectTo: string = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);
  
  return { isAuthenticated, isLoading };
}