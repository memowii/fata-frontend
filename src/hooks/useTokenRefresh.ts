'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { getTokenExpiryTime } from '@/lib/types/token.types';

/**
 * Hook to automatically refresh tokens before they expire
 */
export function useTokenRefresh(refreshThreshold: number = 300) {
  const { accessToken, refreshAuth } = useAuth();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!accessToken) {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = undefined;
      }
      return;
    }
    
    const expiryTime = getTokenExpiryTime(accessToken);
    
    // If token expires in less than threshold seconds, refresh immediately
    if (expiryTime > 0 && expiryTime < refreshThreshold) {
      refreshAuth();
      return;
    }
    
    // Schedule refresh for later
    if (expiryTime > refreshThreshold) {
      const refreshIn = (expiryTime - refreshThreshold) * 1000;
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshAuth();
      }, refreshIn);
    }
    
    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [accessToken, refreshAuth, refreshThreshold]);
}