/**
 * Query Hooks Export
 * Central export point for all TanStack Query hooks
 */

// Authentication hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  useRefreshToken,
  useVerifyEmail,
  useForgotPassword,
  useResetPassword,
  useResendVerification,
  useUpdateProfile,
} from './useAuthQueries';

// Infinite query hooks
export {
  useInfinitePaginatedQuery,
  useInfiniteArticles,
  useInfiniteNotifications,
  useInfiniteCursorQuery,
  flattenInfiniteData,
  getTotalCount,
  hasMorePages,
} from './useInfiniteQueries';