/**
 * Client-side authentication utilities
 * These functions run in the browser and handle API calls
 */

import type { 
  LoginDto, 
  RegisterDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  VerifyEmailDto,
  UserDto 
} from '@/lib/types/auth.types';
import type { AuthResponse, MessageResponse } from '@/lib/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Client-side login
 */
export async function login(credentials: LoginDto): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'include', // Important for cookies
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  
  // Since we're not returning tokens from our API route, we need to construct the response
  return {
    user: data.user,
    accessToken: '', // Tokens are stored in httpOnly cookies
    refreshToken: '', // Tokens are stored in httpOnly cookies
    tokenType: data.tokenType || 'Bearer',
    expiresIn: data.expiresIn || '15m',
  };
}

/**
 * Client-side registration
 */
export async function register(userData: RegisterDto): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return response.json();
}

/**
 * Client-side logout
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordDto): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send reset email');
  }
  
  return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordDto): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }
  
  return response.json();
}

/**
 * Verify email with token
 */
export async function verifyEmail(data: VerifyEmailDto): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify email');
  }
  
  return response.json();
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserDto> {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile');
  }
  
  return response.json();
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<UserDto>): Promise<UserDto> {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  
  return response.json();
}

/**
 * Refresh authentication tokens
 */
export async function refreshTokens(): Promise<void> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh tokens');
  }
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticatedClient(): boolean {
  // This is a simple check - the actual auth state should be managed by context
  // This function can be used for quick client-side checks
  return document.cookie.includes('access_token=');
}

/**
 * Redirect to login with return URL
 */
export function redirectToLogin(returnUrl?: string) {
  const loginUrl = new URL('/login', window.location.origin);
  if (returnUrl) {
    loginUrl.searchParams.set('from', returnUrl);
  }
  window.location.href = loginUrl.toString();
}

/**
 * Redirect to dashboard
 */
export function redirectToDashboard() {
  window.location.href = '/dashboard';
}

/**
 * API client with automatic token handling
 */
export class AuthApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Handle token refresh
    if (response.status === 401) {
      try {
        await refreshTokens();
        // Retry the request
        return this.request<T>(endpoint, options);
      } catch {
        redirectToLogin(window.location.pathname);
        throw new Error('Authentication required');
      }
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export a default instance
export const apiClient = new AuthApiClient();