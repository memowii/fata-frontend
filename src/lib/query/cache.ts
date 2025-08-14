/**
 * Cache Management Utilities
 * Advanced cache manipulation and invalidation strategies
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * Selective cache invalidation patterns
 */
export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all auth-related queries
   */
  invalidateAuth() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.auth.all,
    });
  }

  /**
   * Invalidate all user-related queries
   */
  invalidateUser(userId?: string) {
    if (userId) {
      return this.queryClient.invalidateQueries({
        queryKey: queryKeys.user.detail(userId),
      });
    }
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.user.all,
    });
  }

  /**
   * Clear all cached data
   */
  clearAll() {
    this.queryClient.clear();
  }

  /**
   * Clear specific query data
   */
  clearQuery(queryKey: readonly unknown[]) {
    this.queryClient.removeQueries({ queryKey });
  }

  /**
   * Reset queries to their initial state
   */
  resetQueries(queryKey?: readonly unknown[]) {
    if (queryKey) {
      return this.queryClient.resetQueries({ queryKey });
    }
    return this.queryClient.resetQueries();
  }

  /**
   * Prefetch and cache data
   */
  async prefetch<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    staleTime?: number
  ) {
    return this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  }

  /**
   * Set query data directly
   */
  setQueryData<T>(queryKey: readonly unknown[], data: T) {
    this.queryClient.setQueryData(queryKey, data);
  }

  /**
   * Get cached query data
   */
  getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
    return this.queryClient.getQueryData<T>(queryKey);
  }

  /**
   * Update specific item in a list cache
   */
  updateListItem<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updater: (item: T) => T
  ) {
    this.queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((item) =>
        item.id === itemId ? updater(item) : item
      );
    });
  }

  /**
   * Remove specific item from a list cache
   */
  removeListItem<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string
  ) {
    this.queryClient.setQueryData<T[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((item) => item.id !== itemId);
    });
  }

  /**
   * Add item to a list cache
   */
  addListItem<T>(
    queryKey: readonly unknown[],
    item: T,
    position: 'start' | 'end' = 'start'
  ) {
    this.queryClient.setQueryData<T[]>(queryKey, (oldData = []) => {
      return position === 'start' ? [item, ...oldData] : [...oldData, item];
    });
  }

  /**
   * Batch update multiple queries
   */
  batchUpdate(updates: Array<{ key: readonly unknown[]; data: unknown }>) {
    updates.forEach(({ key, data }) => {
      this.queryClient.setQueryData(key, data);
    });
  }

  /**
   * Smart invalidation based on mutation result
   */
  smartInvalidate(mutationKey: readonly unknown[], result?: unknown) {
    // Map mutation keys to affected query keys
    const invalidationMap: Record<string, readonly unknown[][]> = {
      'auth.login': [queryKeys.auth.all, queryKeys.user.all],
      'auth.logout': [queryKeys.auth.all, queryKeys.user.all],
      'auth.register': [queryKeys.auth.all],
      'user.update-profile': [queryKeys.auth.user(), queryKeys.user.profile()],
      'user.update-preferences': [queryKeys.user.preferences()],
    };

    const keyString = mutationKey.join('.');
    const keysToInvalidate = invalidationMap[keyString] || [];

    return Promise.all(
      keysToInvalidate.map((key) =>
        this.queryClient.invalidateQueries({ queryKey: key })
      )
    );
  }

  /**
   * Garbage collection for old queries
   */
  collectGarbage(maxAge: number = 5 * 60 * 1000) {
    const now = Date.now();
    const cache = this.queryClient.getQueryCache();
    
    cache.getAll().forEach((query) => {
      const lastUpdated = query.state.dataUpdatedAt;
      if (now - lastUpdated > maxAge && !query.getObserversCount()) {
        cache.remove(query);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      fetchingQueries: queries.filter((q) => q.state.fetchStatus === 'fetching').length,
    };
  }

  /**
   * Warm up cache with initial data
   */
  async warmupCache(data: Array<{ key: readonly unknown[]; value: unknown }>) {
    data.forEach(({ key, value }) => {
      this.queryClient.setQueryData(key, value);
    });
  }

  /**
   * Subscribe to cache changes
   */
  subscribe(
    queryKey: readonly unknown[],
    callback: (data: unknown) => void
  ) {
    return this.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && 
          event.query.queryKey.toString() === queryKey.toString()) {
        callback(event.query.state.data);
      }
    });
  }
}

/**
 * Create cache manager instance
 */
export function createCacheManager(queryClient: QueryClient) {
  return new CacheManager(queryClient);
}

/**
 * Cache patterns for common scenarios
 */
export const cachePatterns = {
  /**
   * Invalidate related queries after mutation
   */
  invalidateRelated: (
    queryClient: QueryClient,
    patterns: Array<readonly unknown[]>
  ) => {
    return Promise.all(
      patterns.map((pattern) =>
        queryClient.invalidateQueries({ queryKey: pattern })
      )
    );
  },

  /**
   * Update nested data in cache
   */
  updateNested: <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    path: string[],
    value: unknown
  ) => {
    queryClient.setQueryData<T>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      
      const newData = { ...oldData } as any;
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  },

  /**
   * Merge paginated results
   */
  mergePaginated: <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newPage: { items: T[]; page: number }
  ) => {
    queryClient.setQueryData<{ items: T[]; pages: Map<number, T[]> }>(
      queryKey,
      (oldData) => {
        if (!oldData) {
          return {
            items: newPage.items,
            pages: new Map([[newPage.page, newPage.items]]),
          };
        }
        
        const pages = new Map(oldData.pages);
        pages.set(newPage.page, newPage.items);
        
        const items = Array.from(pages.values()).flat();
        
        return { items, pages };
      }
    );
  },
};