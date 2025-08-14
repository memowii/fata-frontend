/**
 * Infinite Query Hooks
 * For pagination and infinite scrolling implementations
 */

import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  InfiniteData,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';

/**
 * Generic infinite query hook for paginated data
 */
export function useInfinitePaginatedQuery<T>(
  endpoint: string,
  queryKey: readonly unknown[],
  filters?: Record<string, unknown>,
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResponse<T>,
      AxiosError<ApiResponse>,
      InfiniteData<PaginatedResponse<T>>,
      PaginatedResponse<T>,
      readonly unknown[],
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'getPreviousPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: [...queryKey, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        pageSize: 20,
        ...filters,
      };

      const response = await api.get<PaginatedResponse<T>>(endpoint, {
        params,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.hasPrevious) {
        return firstPage.page - 1;
      }
      return undefined;
    },
    ...options,
  });
}

/**
 * Hook for infinite scrolling articles (example implementation)
 */
export function useInfiniteArticles(
  filters?: {
    search?: string;
    category?: string;
    userId?: string;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResponse<any>,
      AxiosError<ApiResponse>,
      InfiniteData<PaginatedResponse<any>>,
      PaginatedResponse<any>,
      readonly unknown[],
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfinitePaginatedQuery(
    '/articles',
    queryKeys.article.lists(),
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  );
}

/**
 * Hook for infinite scrolling notifications
 */
export function useInfiniteNotifications(
  filters?: {
    unread?: boolean;
    type?: string;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResponse<any>,
      AxiosError<ApiResponse>,
      InfiniteData<PaginatedResponse<any>>,
      PaginatedResponse<any>,
      readonly unknown[],
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfinitePaginatedQuery(
    '/notifications',
    queryKeys.notification.lists(),
    filters,
    {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 60 * 1000, // Refetch every minute
      ...options,
    }
  );
}

/**
 * Cursor-based infinite query hook
 */
export function useInfiniteCursorQuery<T>(
  endpoint: string,
  queryKey: readonly unknown[],
  filters?: Record<string, unknown>,
  options?: Omit<
    UseInfiniteQueryOptions<
      {
        items: T[];
        nextCursor: string | null;
        previousCursor: string | null;
      },
      AxiosError<ApiResponse>,
      InfiniteData<{
        items: T[];
        nextCursor: string | null;
        previousCursor: string | null;
      }>,
      {
        items: T[];
        nextCursor: string | null;
        previousCursor: string | null;
      },
      readonly unknown[],
      string | null
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'getPreviousPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: [...queryKey, filters],
    queryFn: async ({ pageParam = null }) => {
      const params = {
        cursor: pageParam,
        limit: 20,
        ...filters,
      };

      const response = await api.get<{
        items: T[];
        nextCursor: string | null;
        previousCursor: string | null;
      }>(endpoint, { params });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }

      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.previousCursor,
    ...options,
  });
}

/**
 * Utility to flatten pages from infinite query
 */
export function flattenInfiniteData<T>(
  data: InfiniteData<PaginatedResponse<T>> | undefined
): T[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}

/**
 * Utility to get total count from infinite query
 */
export function getTotalCount<T>(
  data: InfiniteData<PaginatedResponse<T>> | undefined
): number {
  if (!data || data.pages.length === 0) return 0;
  return data.pages[0].total;
}

/**
 * Utility to check if there are more pages
 */
export function hasMorePages<T>(
  data: InfiniteData<PaginatedResponse<T>> | undefined
): boolean {
  if (!data || data.pages.length === 0) return false;
  const lastPage = data.pages[data.pages.length - 1];
  return lastPage.hasNext;
}