'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthContextValue, LoginDto, RegisterDto, UserDto } from '@/lib/types/auth.types';
import { 
  login as clientLogin, 
  register as clientRegister, 
  logout as clientLogout,
  getCurrentUserProfile,
  refreshTokens
} from '@/lib/auth/client';
import { decodeJwt, isTokenExpired } from '@/lib/types/token.types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: UserDto | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserDto | null>(initialUser);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = !!user && !!accessToken;
  
  // Check authentication status on mount
  useEffect(() => {
    if (!initialUser) {
      checkAuth();
    }
  }, [initialUser]);
  
  // Set up token refresh interval
  useEffect(() => {
    if (!accessToken) return;
    
    const checkAndRefresh = async () => {
      try {
        const expiryTime = getTokenExpiryTime(accessToken);
        // Refresh when token has less than 5 minutes left
        if (expiryTime < 300) {
          await refreshAuth();
        }
      } catch (error) {
        console.error('Token refresh check failed:', error);
      }
    };
    
    // Check every minute
    const interval = setInterval(checkAndRefresh, 60000);
    
    return () => clearInterval(interval);
  }, [accessToken]);
  
  const checkAuth = async () => {
    try {
      setIsInitializing(true);
      // Try to get user profile (will use cookies)
      const userProfile = await getCurrentUserProfile();
      setUser(userProfile);
      
      // Extract token from cookie if available (this is a simplified approach)
      // In production, tokens should be managed more securely
      const token = getCookieValue('access_token');
      if (token) {
        setAccessToken(token);
      }
    } catch (error) {
      // User is not authenticated
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsInitializing(false);
    }
  };
  
  const login = async (credentials: LoginDto) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await clientLogin(credentials);
      
      // Check if email is verified
      if (!response.user.emailVerified) {
        // Redirect to verification pending page
        router.push(`/verify-pending?email=${encodeURIComponent(credentials.email)}`);
        return response;
      }
      
      setUser(response.user);
      // Tokens are now stored in httpOnly cookies, so we don't store them in state
      setAccessToken('stored-in-cookie');
      setRefreshToken('stored-in-cookie');
      
      // Redirect to dashboard or return URL
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || '/dashboard';
      router.push(from);
      
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      // Don't re-throw - let the UI component handle it via the error state
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: RegisterDto) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await clientRegister(userData);
      
      // Don't set tokens yet since email is not verified
      // Just redirect to verification pending page
      router.push(`/verify-pending?email=${encodeURIComponent(userData.email)}`);
      
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      // Don't re-throw - let the UI component handle it via the error state
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      await clientLogout();
      
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshAuth = useCallback(async () => {
    try {
      await refreshTokens();
      
      // Fetch updated user profile
      const userProfile = await getCurrentUserProfile();
      setUser(userProfile);
      
      // Get new token from cookie
      const token = getCookieValue('access_token');
      if (token) {
        setAccessToken(token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
    }
  }, []);
  
  const clearError = () => {
    setError(null);
  };
  
  const value: AuthContextValue = {
    user,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: '15m',
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshAuth,
    clearError,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility function to get cookie value (client-side)
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Utility function to get token expiry time
function getTokenExpiryTime(token: string): number {
  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - now;
  } catch {
    return 0;
  }
}