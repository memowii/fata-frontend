/**
 * Authentication Query Hooks
 * Comprehensive TanStack Query hooks for authentication operations
 */

import { 
  useMutation, 
  useQuery, 
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { api, tokenManager } from '@/lib/api/client';
import { queryKeys, mutationKeys } from '@/lib/query/query-keys';
import type {
  UserDto,
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@/lib/types/auth.types';
import type {
  ApiResponse,
  AuthResponse,
  MessageResponse,
  ApiError,
} from '@/lib/types/api.types';

/**
 * Custom error type for better error handling
 */
type QueryError = AxiosError<ApiResponse> & {
  apiError?: ApiError;
};

/**
 * Hook for user login
 */
export function useLogin(
  options?: UseMutationOptions<AuthResponse, QueryError, LoginDto>
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<AuthResponse, QueryError, LoginDto>({
    mutationKey: mutationKeys.login,
    mutationFn: async (credentials) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // Store tokens
      tokenManager.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      
      // Update user in cache
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      
      // Invalidate any stale auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
      
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error, variables, context) => {
      // Clear any existing tokens on login error
      tokenManager.clearTokens();
      
      // Call custom onError if provided
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for user registration
 */
export function useRegister(
  options?: UseMutationOptions<AuthResponse, QueryError, RegisterDto>
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<AuthResponse, QueryError, RegisterDto>({
    mutationKey: mutationKeys.register,
    mutationFn: async (userData) => {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // Store tokens
      tokenManager.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      
      // Update user in cache
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
      
      // Redirect to dashboard or verification page
      if (data.user.emailVerified) {
        router.push('/dashboard');
      } else {
        router.push('/verify-email?sent=true');
      }
    },
    ...options,
  });
}

/**
 * Hook for user logout
 */
export function useLogout(
  options?: UseMutationOptions<MessageResponse, QueryError, void>
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<MessageResponse, QueryError, void>({
    mutationKey: mutationKeys.logout,
    mutationFn: async () => {
      const response = await api.post<MessageResponse>('/auth/logout');
      if (!response.success) {
        throw new Error(response.error?.message || 'Logout failed');
      }
      return response.data!;
    },
    onSuccess: (data, variables, context) => {
      // Clear tokens
      tokenManager.clearTokens();
      
      // Clear all cached data
      queryClient.clear();
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
      
      // Redirect to login
      router.push('/login');
    },
    onSettled: () => {
      // Always clear tokens even if logout fails
      tokenManager.clearTokens();
    },
    ...options,
  });
}

/**
 * Hook for fetching current user
 */
export function useCurrentUser(
  options?: UseQueryOptions<UserDto | null, QueryError>
) {
  return useQuery<UserDto | null, QueryError>({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      // Check if we have a token
      const token = tokenManager.getAccessToken();
      if (!token) {
        return null;
      }

      try {
        const response = await api.get<UserDto>('/auth/me');
        if (!response.success || !response.data) {
          return null;
        }
        return response.data;
      } catch (error) {
        // Clear tokens if user fetch fails with 401
        if ((error as AxiosError).response?.status === 401) {
          tokenManager.clearTokens();
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider user data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // Don't retry failed user fetches
    ...options,
  });
}

/**
 * Hook for refreshing authentication token
 */
export function useRefreshToken(
  options?: UseMutationOptions<AuthResponse, QueryError, void>
) {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, QueryError, void>({
    mutationKey: mutationKeys.refreshToken,
    mutationFn: async () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Token refresh failed');
      }
      
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // Update tokens
      tokenManager.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      
      // Update user if provided
      if (data.user) {
        queryClient.setQueryData(queryKeys.auth.user(), data.user);
      }
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Clear tokens on refresh failure
      tokenManager.clearTokens();
      
      // Clear auth cache
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      
      // Call custom onError if provided
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for email verification
 */
export function useVerifyEmail(
  options?: UseMutationOptions<MessageResponse, QueryError, VerifyEmailDto>
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<MessageResponse, QueryError, VerifyEmailDto>({
    mutationKey: mutationKeys.verifyEmail,
    mutationFn: async ({ token }) => {
      const response = await api.post<MessageResponse>('/auth/verify-email', {
        token,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Email verification failed');
      }
      
      return response.data!;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate user query to refetch with updated emailVerified status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    ...options,
  });
}

/**
 * Hook for forgot password
 */
export function useForgotPassword(
  options?: UseMutationOptions<MessageResponse, QueryError, ForgotPasswordDto>
) {
  return useMutation<MessageResponse, QueryError, ForgotPasswordDto>({
    mutationKey: mutationKeys.forgotPassword,
    mutationFn: async ({ email }) => {
      const response = await api.post<MessageResponse>('/auth/forgot-password', {
        email,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send reset email');
      }
      
      return response.data!;
    },
    ...options,
  });
}

/**
 * Hook for password reset
 */
export function useResetPassword(
  options?: UseMutationOptions<MessageResponse, QueryError, ResetPasswordDto>
) {
  const router = useRouter();

  return useMutation<MessageResponse, QueryError, ResetPasswordDto>({
    mutationKey: mutationKeys.resetPassword,
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.post<MessageResponse>('/auth/reset-password', {
        token,
        newPassword,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Password reset failed');
      }
      
      return response.data!;
    },
    onSuccess: (data, variables, context) => {
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);
    },
    ...options,
  });
}

/**
 * Hook for resending verification email
 */
export function useResendVerification(
  options?: UseMutationOptions<MessageResponse, QueryError, void>
) {
  return useMutation<MessageResponse, QueryError, void>({
    mutationKey: mutationKeys.resendVerification,
    mutationFn: async () => {
      const response = await api.post<MessageResponse>('/auth/resend-verification');
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to resend verification email');
      }
      
      return response.data!;
    },
    ...options,
  });
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile(
  options?: UseMutationOptions<UserDto, QueryError, Partial<UserDto>>
) {
  const queryClient = useQueryClient();

  return useMutation<UserDto, QueryError, Partial<UserDto>>({
    mutationKey: mutationKeys.updateProfile,
    mutationFn: async (profileData) => {
      const response = await api.patch<UserDto>('/users/profile', profileData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Profile update failed');
      }
      
      return response.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.user() });
      
      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<UserDto>(queryKeys.auth.user());
      
      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData(queryKeys.auth.user(), {
          ...previousUser,
          ...newData,
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.user(), context.previousUser);
      }
      
      // Call custom onError if provided
      options?.onError?.(error, variables, context);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
    onSuccess: (data, variables, context) => {
      // Update the cache with the server response
      queryClient.setQueryData(queryKeys.auth.user(), data);
      
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}