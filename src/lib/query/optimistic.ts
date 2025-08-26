/**
 * Optimistic Update Utilities
 * Helpers for implementing optimistic updates with proper rollback
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Context for optimistic updates with rollback capability
 */
export interface OptimisticContext<T> {
  previousData: T | undefined;
  rollback: () => void;
}

/**
 * Create an optimistic update helper
 */
export function createOptimisticUpdate<T, TVariables = unknown>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updateFn: (oldData: T | undefined, variables: TVariables) => T
) {
  return {
    async onMutate(variables: TVariables): Promise<OptimisticContext<T>> {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (oldData: T | undefined) =>
        updateFn(oldData, variables)
      );

      // Return context with rollback function
      return {
        previousData,
        rollback: () => {
          queryClient.setQueryData(queryKey, previousData);
        },
      };
    },

    onError(_error: unknown, _variables: TVariables, context?: OptimisticContext<T>) {
      // Rollback on error
      context?.rollback();
    },

    onSettled() {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Optimistic update for list operations
 */
export function createListOptimisticUpdate<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  return {
    add: createOptimisticUpdate<T[], T>(
      queryClient,
      queryKey,
      (oldData = [], newItem) => [newItem, ...oldData]
    ),

    update: createOptimisticUpdate<T[], Partial<T> & { id: string }>(
      queryClient,
      queryKey,
      (oldData = [], updatedItem) =>
        oldData.map((item) =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        )
    ),

    remove: createOptimisticUpdate<T[], string>(
      queryClient,
      queryKey,
      (oldData = [], itemId) => oldData.filter((item) => item.id !== itemId)
    ),

    reorder: createOptimisticUpdate<T[], { fromIndex: number; toIndex: number }>(
      queryClient,
      queryKey,
      (oldData = [], { fromIndex, toIndex }) => {
        const newData = [...oldData];
        const [removed] = newData.splice(fromIndex, 1);
        newData.splice(toIndex, 0, removed);
        return newData;
      }
    ),
  };
}

/**
 * Optimistic update for paginated data
 */
export function createPaginatedOptimisticUpdate<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  interface PaginatedData {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }

  return {
    add: createOptimisticUpdate<PaginatedData, T>(
      queryClient,
      queryKey,
      (oldData, newItem) => {
        if (!oldData) {
          return {
            items: [newItem],
            total: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          };
        }
        return {
          ...oldData,
          items: [newItem, ...oldData.items],
          total: oldData.total + 1,
        };
      }
    ),

    update: createOptimisticUpdate<PaginatedData, Partial<T> & { id: string }>(
      queryClient,
      queryKey,
      (oldData, updatedItem) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          ),
        };
      }
    ),

    remove: createOptimisticUpdate<PaginatedData, string>(
      queryClient,
      queryKey,
      (oldData, itemId) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.filter((item) => item.id !== itemId),
          total: Math.max(0, oldData.total - 1),
        };
      }
    ),
  };
}

/**
 * Optimistic update for infinite queries
 */
export function createInfiniteOptimisticUpdate<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  interface Page {
    items: T[];
    nextCursor: string | null;
    previousCursor: string | null;
  }

  interface InfiniteData {
    pages: Page[];
    pageParams: unknown[];
  }

  return {
    add: createOptimisticUpdate<InfiniteData, T>(
      queryClient,
      queryKey,
      (oldData, newItem) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [newItem],
                nextCursor: null,
                previousCursor: null,
              },
            ],
            pageParams: [null],
          };
        }
        
        // Add to the first page
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [newItem, ...newPages[0].items],
        };
        
        return {
          ...oldData,
          pages: newPages,
        };
      }
    ),

    update: createOptimisticUpdate<InfiniteData, Partial<T> & { id: string }>(
      queryClient,
      queryKey,
      (oldData, updatedItem) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === updatedItem.id ? { ...item, ...updatedItem } : item
            ),
          })),
        };
      }
    ),

    remove: createOptimisticUpdate<InfiniteData, string>(
      queryClient,
      queryKey,
      (oldData, itemId) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== itemId),
          })),
        };
      }
    ),
  };
}

/**
 * Batch optimistic updates
 */
export async function batchOptimisticUpdates(
  queryClient: QueryClient,
  updates: Array<() => void | Promise<void>>
) {
  // Pause the query client to batch updates
  queryClient.setMutationDefaults(['batch'], {
    mutationFn: async () => {
      await Promise.all(updates.map((update) => update()));
    },
  });
}

/**
 * Utility to create a rollback function
 */
export function createRollback<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  previousData: T | undefined
) {
  return () => {
    queryClient.setQueryData(queryKey, previousData);
  };
}