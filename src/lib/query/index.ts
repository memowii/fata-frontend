/**
 * TanStack Query Library Exports
 * Central export point for all query-related utilities
 */

// Query client and configuration
export { 
  createQueryClient, 
  getQueryClient, 
  queryClientConfig 
} from './query-client';

// Query keys
export { 
  queryKeys, 
  mutationKeys, 
  authKeys, 
  userKeys, 
  articleKeys, 
  audioKeys, 
  notificationKeys, 
  settingsKeys,
  type QueryKey,
  type MutationKey 
} from './query-keys';

// Prefetch utilities
export {
  getServerQueryClient,
  prefetchCurrentUser,
  prefetchUserProfile,
  prefetchQueries,
  dehydrateQueries,
  createPrefetchFunction,
  prefetchDashboard,
  prefetchProfile,
  isServer,
  getInitialData,
} from './prefetch';

// Optimistic updates
export {
  createOptimisticUpdate,
  createListOptimisticUpdate,
  createPaginatedOptimisticUpdate,
  createInfiniteOptimisticUpdate,
  batchOptimisticUpdates,
  createRollback,
  type OptimisticContext,
} from './optimistic';

// Error handling
export {
  ApiRequestError,
  getUserFriendlyMessage,
  extractValidationErrors,
  isRetryableError,
  calculateRetryDelay,
  logError,
  createMutationErrorHandler,
  createQueryErrorHandler,
  parseErrorForDisplay,
  type ErrorFallbackProps,
} from './error-handling';

// Cache management
export {
  CacheManager,
  createCacheManager,
  cachePatterns,
} from './cache';