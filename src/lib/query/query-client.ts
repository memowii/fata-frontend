/**
 * TanStack Query Client Configuration
 * Provides centralized query client setup with optimized defaults
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiError, ApiResponse } from '@/lib/types/api.types';

/**
 * Global error handler for queries and mutations
 */
function handleGlobalError(error: unknown): void {
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<ApiResponse>;
    const apiError = axiosError.response?.data?.error;
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status: axiosError.response?.status,
        message: apiError?.message || axiosError.message,
        code: apiError?.code,
        details: apiError?.details,
      });
    }

    // Handle specific error cases
    if (axiosError.response?.status === 401) {
      // Token expired or invalid - will be handled by interceptor
      return;
    }

    if (axiosError.response?.status === 429) {
      // Rate limit exceeded
      console.warn('Rate limit exceeded. Please try again later.');
    }

    // Network errors
    if (!axiosError.response) {
      console.error('Network error. Please check your connection.');
    }
  }
}

/**
 * Create and configure the query client
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        
        // Garbage collection time: cached data is kept for 5 minutes
        gcTime: 5 * 60 * 1000,
        
        // Retry configuration with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if ((error as AxiosError).response?.status && 
              (error as AxiosError).response!.status >= 400 && 
              (error as AxiosError).response!.status < 500) {
            return false;
          }
          
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        
        // Don't refetch on reconnect by default (can be overridden per query)
        refetchOnReconnect: 'always',
        
        // Network mode: online-first with offline fallback
        networkMode: 'online',
      },
      
      mutations: {
        // Retry configuration for mutations
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if ((error as AxiosError).response?.status && 
              (error as AxiosError).response!.status >= 400 && 
              (error as AxiosError).response!.status < 500) {
            return false;
          }
          
          // Only retry once for mutations (to avoid duplicate operations)
          return failureCount < 1;
        },
        
        // Network mode for mutations
        networkMode: 'online',
        
        // Don't pause mutations by default
        throwOnError: false,
      },
    },
    
    // Query cache with global error handler
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only handle errors for queries that don't have their own error handler
        if (!query.options.onError) {
          handleGlobalError(error);
        }
      },
      
      onSuccess: (_data, query) => {
        // Log successful queries in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Query success: ${query.queryKey}`);
        }
      },
    }),
    
    // Mutation cache with global error handler
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Only handle errors for mutations that don't have their own error handler
        if (!mutation.options.onError) {
          handleGlobalError(error);
        }
      },
      
      onSuccess: (_data, _variables, _context, mutation) => {
        // Log successful mutations in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Mutation success: ${mutation.options.mutationKey || 'unknown'}`);
        }
      },
    }),
  });
}

/**
 * Singleton query client instance
 */
let queryClient: QueryClient | undefined;

/**
 * Get or create the query client singleton
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

/**
 * Query client configuration for SSR
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Disable automatic refetching in SSR
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
};