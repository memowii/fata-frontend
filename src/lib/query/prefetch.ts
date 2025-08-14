/**
 * Prefetch Utilities for SSR/SSG
 * Server-side data fetching for Next.js App Router
 */

import { QueryClient, dehydrate } from '@tanstack/react-query';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { queryKeys } from './query-keys';
import type { UserDto } from '@/lib/types/auth.types';

// API base URL for server-side requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Create a server-side query client
 * Cached per request to ensure consistency
 */
export const getServerQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Longer stale time for SSR
        staleTime: 60 * 1000, // 1 minute
        // Don't refetch on mount during SSR
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
});

/**
 * Server-side API request with cookie forwarding
 */
async function serverFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken.value}` }),
      ...options?.headers,
    },
    // Include cookies in the request
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data;
}

/**
 * Prefetch current user data
 */
export async function prefetchCurrentUser(queryClient: QueryClient) {
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.user(),
      queryFn: () => serverFetch<UserDto>('/auth/me'),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  } catch (error) {
    // User not authenticated, return null
    queryClient.setQueryData(queryKeys.auth.user(), null);
  }
}

/**
 * Prefetch user profile
 */
export async function prefetchUserProfile(
  queryClient: QueryClient,
  userId: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.user.detail(userId),
    queryFn: () => serverFetch<UserDto>(`/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Prefetch multiple queries in parallel
 */
export async function prefetchQueries(
  queryClient: QueryClient,
  queries: Array<{
    key: readonly unknown[];
    fn: () => Promise<unknown>;
    staleTime?: number;
  }>
) {
  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery({
        queryKey: query.key,
        queryFn: query.fn,
        staleTime: query.staleTime || 60 * 1000,
      })
    )
  );
}

/**
 * Dehydrate query client for client-side hydration
 */
export function dehydrateQueries(queryClient: QueryClient) {
  return dehydrate(queryClient);
}

/**
 * Helper to create page-specific prefetch functions
 */
export function createPrefetchFunction<T extends Record<string, unknown>>(
  prefetchFn: (queryClient: QueryClient, params: T) => Promise<void>
) {
  return async (params: T) => {
    const queryClient = getServerQueryClient();
    await prefetchFn(queryClient, params);
    return dehydrateQueries(queryClient);
  };
}

/**
 * Prefetch for dashboard page
 */
export const prefetchDashboard = createPrefetchFunction(
  async (queryClient) => {
    await prefetchCurrentUser(queryClient);
    
    // Add more dashboard-specific prefetches here
    // Example: await prefetchUserStats(queryClient);
  }
);

/**
 * Prefetch for profile page
 */
export const prefetchProfile = createPrefetchFunction(
  async (queryClient, { userId }: { userId: string }) => {
    await Promise.all([
      prefetchCurrentUser(queryClient),
      prefetchUserProfile(queryClient, userId),
    ]);
  }
);

/**
 * Utility to check if running on server
 */
export function isServer() {
  return typeof window === 'undefined';
}

/**
 * Utility to get initial data for a query
 */
export function getInitialData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): T | undefined {
  if (isServer()) {
    return queryClient.getQueryData<T>(queryKey);
  }
  return undefined;
}