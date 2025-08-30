/**
 * API Client with Axios Interceptors
 * Handles token management, request queuing, and automatic retries
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  RefreshTokenResponse,
  ApiError 
} from '@/lib/types/api.types';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// CSRF token storage (in memory only for security)
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

/**
 * Token management utilities
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  getTokenExpiry: (): number | null => {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiry ? parseInt(expiry, 10) : null;
    }
    return null;
  },

  setTokens: (accessToken: string, refreshToken: string, expiresIn: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      // Calculate and store expiry timestamp
      const expiryMs = expiresIn.includes('m') 
        ? parseInt(expiresIn) * 60 * 1000 
        : parseInt(expiresIn) * 1000;
      const expiryTimestamp = Date.now() + expiryMs;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
    }
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  },

  isTokenExpired: (): boolean => {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return true;
    
    // Consider token expired if it expires in less than 1 minute
    return Date.now() >= expiry - 60000;
  },

  // CSRF token management (in-memory storage for security)
  getCsrfToken: (): string | null => {
    return csrfToken;
  },

  setCsrfToken: (token: string, expiresAt?: string | number) => {
    csrfToken = token;
    
    if (expiresAt) {
      if (typeof expiresAt === 'string') {
        try {
          csrfTokenExpiry = new Date(expiresAt).getTime();
        } catch {
          // If parsing fails, set expiry to 30 minutes from now
          csrfTokenExpiry = Date.now() + (30 * 60 * 1000);
        }
      } else {
        csrfTokenExpiry = expiresAt;
      }
    } else {
      // Default expiry: 30 minutes from now
      csrfTokenExpiry = Date.now() + (30 * 60 * 1000);
    }
  },

  clearCsrfToken: () => {
    csrfToken = null;
    csrfTokenExpiry = null;
  },

  isCsrfTokenExpired: (): boolean => {
    if (!csrfToken || !csrfTokenExpiry) return true;
    
    // Consider token expired if it expires in less than 1 minute
    return Date.now() >= csrfTokenExpiry - 60000;
  },

  fetchCsrfToken: async (): Promise<string> => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.csrfToken) {
        throw new Error('Invalid CSRF token response');
      }

      tokenManager.setCsrfToken(data.data.csrfToken, data.data.expiresAt);
      return data.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  },

  getValidCsrfToken: async (): Promise<string> => {
    // If we have a valid token that's not expired, return it
    if (csrfToken && !tokenManager.isCsrfTokenExpired()) {
      return csrfToken;
    }

    // Otherwise, fetch a new token
    return tokenManager.fetchCsrfToken();
  },
};

/**
 * Queue for requests during token refresh
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}

class RequestQueue {
  private queue: PendingRequest[] = [];
  private isRefreshing = false;

  add(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, config });
    });
  }

  resolveAll(token: string) {
    this.queue.forEach(({ resolve, config }) => {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(config);
    });
    this.queue = [];
  }

  rejectAll(error: unknown) {
    this.queue.forEach(({ reject }) => {
      reject(error);
    });
    this.queue = [];
  }

  setRefreshing(value: boolean) {
    this.isRefreshing = value;
  }

  getRefreshing() {
    return this.isRefreshing;
  }
}

const requestQueue = new RequestQueue();

/**
 * Create axios instance with base configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

/**
 * Request interceptor for adding auth token and handling token refresh
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token check for auth endpoints
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    // Add CSRF token for state-changing requests (only if enabled)
    const csrfEnabled = process.env.NEXT_PUBLIC_ENABLE_CSRF === 'true';
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const needsCsrfToken = csrfEnabled && stateChangingMethods.includes(config.method?.toUpperCase() || '');
    
    if (needsCsrfToken && !isAuthEndpoint) {
      try {
        const csrfToken = await tokenManager.getValidCsrfToken();
        config.headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.warn('Failed to get CSRF token for request:', error);
        // Continue without CSRF token - let the server handle the error
      }
    }

    if (isAuthEndpoint) {
      return config;
    }

    // Check if token needs refresh
    if (tokenManager.isTokenExpired() && tokenManager.getRefreshToken()) {
      if (!requestQueue.getRefreshing()) {
        requestQueue.setRefreshing(true);
        
        try {
          const refreshToken = tokenManager.getRefreshToken();
          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { 
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
            tokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
            requestQueue.resolveAll(accessToken);
            config.headers.Authorization = `Bearer ${accessToken}`;
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          requestQueue.rejectAll(error);
          tokenManager.clearTokens();
          
          // Redirect to login if refresh fails
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(error);
        } finally {
          requestQueue.setRefreshing(false);
        }
      } else {
        // Wait for ongoing refresh
        return requestQueue.add(config);
      }
    } else {
      // Add current token if available
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling errors and retrying on 401
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 403 errors (CSRF token issues)
    if (error.response?.status === 403 && !originalRequest._retry) {
      const errorData = error.response.data;
      
      // If it's a CSRF token error, clear the token and retry once
      if (errorData?.error?.code?.includes('CSRF')) {
        originalRequest._retry = true;
        tokenManager.clearCsrfToken();
        
        try {
          // Get a fresh CSRF token and retry the request
          const newCsrfToken = await tokenManager.getValidCsrfToken();
          originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
          return apiClient(originalRequest);
        } catch (csrfError) {
          console.error('Failed to refresh CSRF token:', csrfError);
          return Promise.reject(error);
        }
      }
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Skip retry for auth endpoints
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
      if (authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint))) {
        return Promise.reject(error);
      }

      // Try to refresh token
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken && !requestQueue.getRefreshing()) {
        requestQueue.setRefreshing(true);

        try {
          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { 
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
            tokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          tokenManager.clearTokens();
          
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          requestQueue.setRefreshing(false);
        }
      }
    }

    // Transform error for consistent handling
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status,
      details: error.response?.data?.error?.details,
    };

    return Promise.reject({
      ...error,
      apiError,
    });
  }
);

/**
 * Generic API request function
 */
export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: unknown,
  config?: Partial<InternalAxiosRequestConfig>
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * API methods for common operations
 */
export const api = {
  get: <T = unknown>(url: string, config?: Partial<InternalAxiosRequestConfig>) => 
    apiRequest<T>('GET', url, undefined, config),
    
  post: <T = unknown>(url: string, data?: unknown, config?: Partial<InternalAxiosRequestConfig>) => 
    apiRequest<T>('POST', url, data, config),
    
  put: <T = unknown>(url: string, data?: unknown, config?: Partial<InternalAxiosRequestConfig>) => 
    apiRequest<T>('PUT', url, data, config),
    
  patch: <T = unknown>(url: string, data?: unknown, config?: Partial<InternalAxiosRequestConfig>) => 
    apiRequest<T>('PATCH', url, data, config),
    
  delete: <T = unknown>(url: string, config?: Partial<InternalAxiosRequestConfig>) => 
    apiRequest<T>('DELETE', url, undefined, config),
};

/**
 * Export configured axios instance for advanced use cases
 */
export default apiClient;