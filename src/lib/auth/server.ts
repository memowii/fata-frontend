/**
 * Server-side authentication utilities
 * These functions run on the server and handle secure token management
 */

import { cookies } from 'next/headers';
import { cache } from 'react';
import type { UserDto } from '@/lib/types/auth.types';
import type { AuthResponse, RefreshTokenResponse } from '@/lib/types/api.types';
import { decodeJwt, isTokenExpired } from '@/lib/types/token.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Cookie configuration for different environments
 */
const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
};

/**
 * Set authentication cookies
 */
export async function setAuthCookies(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: string | number;
}) {
  const cookieStore = await cookies();
  const config = getCookieConfig();
  
  // Calculate expiry times
  const accessTokenExpiry = typeof tokens.expiresIn === 'string' 
    ? parseExpiry(tokens.expiresIn) 
    : tokens.expiresIn * 1000;
    
  const refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Set access token cookie
  cookieStore.set('access_token', tokens.accessToken, {
    ...config,
    maxAge: accessTokenExpiry / 1000,
  });
  
  // Set refresh token cookie
  cookieStore.set('refresh_token', tokens.refreshToken, {
    ...config,
    maxAge: refreshTokenExpiry / 1000,
  });
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const config = getCookieConfig();
  
  cookieStore.set('access_token', '', {
    ...config,
    maxAge: 0,
  });
  
  cookieStore.set('refresh_token', '', {
    ...config,
    maxAge: 0,
  });
}

/**
 * Get current user from cookies (cached per request)
 */
export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken || isTokenExpired(accessToken)) {
      // Try to refresh if we have a refresh token
      const refreshToken = cookieStore.get('refresh_token')?.value;
      if (refreshToken && !isTokenExpired(refreshToken)) {
        const newTokens = await refreshAccessToken(refreshToken);
        if (newTokens) {
          await setAuthCookies({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresIn: newTokens.expiresIn,
          });
          
          const decoded = decodeJwt(newTokens.accessToken);
          if (decoded) {
            return {
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              emailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }
      return null;
    }
    
    const decoded = decodeJwt(accessToken);
    if (!decoded) {
      return null;
    }
    
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
});

/**
 * Check if user is authenticated (cached per request)
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
});

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken || isTokenExpired(accessToken)) {
    // Try to refresh
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (refreshToken && !isTokenExpired(refreshToken)) {
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens) {
        await setAuthCookies({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
        });
        return newTokens.accessToken;
      }
    }
    return null;
  }
  
  return accessToken;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Server-side login
 */
export async function serverLogin(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data: AuthResponse = await response.json();
    
    // Set cookies
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

/**
 * Server-side logout
 */
export async function serverLogout() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (accessToken) {
      // Notify backend to invalidate refresh token
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Add authorization header
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
    }
    
    // Clear cookies regardless of backend response
    await clearAuthCookies();
  } catch (error) {
    console.error('Error during logout:', error);
    // Clear cookies anyway
    await clearAuthCookies();
  }
}

/**
 * Parse expiry string (e.g., '15m', '1h', '7d') to milliseconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 15 * 60 * 1000; // Default to 15 minutes
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

/**
 * Require authentication for a server component
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const { redirect } = await import('next/navigation');
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

/**
 * Require guest (not authenticated) for a server component
 * Redirects to dashboard if authenticated
 */
export async function requireGuest() {
  const { redirect } = await import('next/navigation');
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }
}