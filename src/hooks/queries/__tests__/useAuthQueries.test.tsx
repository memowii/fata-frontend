import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { QueryClient } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  useRefreshToken,
  useForgotPassword,
  useResetPassword,
  useVerifyEmail,
  useUpdateProfile,
} from '../useAuthQueries'
import { AllTheProviders } from '@/test/utils/test-utils'
import { tokenManager } from '@/lib/api/client'
import { mockUser, mockAuthResponse } from '@/test/fixtures/auth'

// Mock Next.js router
jest.mock('next/navigation')

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

describe('useAuthQueries', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }
  
  let queryClient: QueryClient
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    // Clear token manager
    jest.spyOn(tokenManager, 'setTokens').mockImplementation(() => {})
    jest.spyOn(tokenManager, 'clearTokens').mockImplementation(() => {})
    jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue(null)
    jest.spyOn(tokenManager, 'getRefreshToken').mockReturnValue(null)
  })

  describe('useLogin', () => {
    it('should successfully login user', async () => {
      const { result } = renderHook(() => useLogin(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'Password123!',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockAuthResponse)
        expect(tokenManager.setTokens).toHaveBeenCalledWith(
          mockAuthResponse.accessToken,
          mockAuthResponse.refreshToken,
          mockAuthResponse.expiresIn
        )
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle login error', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/login`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS',
              },
            },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => useLogin(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(
        result.current.mutateAsync({
          email: 'invalid@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(tokenManager.clearTokens).toHaveBeenCalled()
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })

    it('should call custom onSuccess callback', async () => {
      const onSuccess = jest.fn()
      
      const { result } = renderHook(
        () => useLogin({ onSuccess }),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>
              {children}
            </AllTheProviders>
          ),
        }
      )

      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'Password123!',
      })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          mockAuthResponse,
          expect.objectContaining({
            email: 'test@example.com',
            password: 'Password123!',
          }),
          undefined
        )
      })
    })
  })

  describe('useRegister', () => {
    it('should successfully register user', async () => {
      const { result } = renderHook(() => useRegister(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(tokenManager.setTokens).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should redirect to email verification if user not verified', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/register`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              ...mockAuthResponse,
              user: {
                ...mockUser,
                emailVerified: false,
              },
            },
          })
        })
      )

      const { result } = renderHook(() => useRegister(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/verify-email?sent=true')
      })
    })

    it('should handle registration error for existing email', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/register`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Email already registered',
                code: 'EMAIL_EXISTS',
              },
            },
            { status: 409 }
          )
        })
      )

      const { result } = renderHook(() => useRegister(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(
        result.current.mutateAsync({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'User',
        })
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useCurrentUser', () => {
    it('should fetch current user when authenticated', async () => {
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('valid-token')

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockUser)
      })
    })

    it('should return null when not authenticated', async () => {
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue(null)

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toBeNull()
      })
    })

    it('should clear tokens on 401 error', async () => {
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('expired-token')
      
      server.use(
        http.get(`${API_BASE_URL}/auth/me`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
              },
            },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toBeNull()
        expect(tokenManager.clearTokens).toHaveBeenCalled()
      })
    })
  })

  describe('useLogout', () => {
    it('should successfully logout user', async () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(tokenManager.clearTokens).toHaveBeenCalled()
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        expect(mockRouter.push).toHaveBeenCalledWith('/login')
      })
    })

    it('should clear tokens even on logout failure', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/logout`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useLogout(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      try {
        await result.current.mutateAsync()
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(tokenManager.clearTokens).toHaveBeenCalled()
      })
    })
  })

  describe('useRefreshToken', () => {
    it('should successfully refresh tokens', async () => {
      jest.spyOn(tokenManager, 'getRefreshToken').mockReturnValue('valid-refresh-token')

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(tokenManager.setTokens).toHaveBeenCalledWith(
          'new-access-token',
          'new-refresh-token',
          expect.any(Number)
        )
      })
    })

    it('should handle invalid refresh token', async () => {
      jest.spyOn(tokenManager, 'getRefreshToken').mockReturnValue('invalid-refresh-token')
      
      server.use(
        http.post(`${API_BASE_URL}/auth/refresh`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Invalid refresh token',
                code: 'INVALID_TOKEN',
              },
            },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(result.current.mutateAsync()).rejects.toThrow()

      await waitFor(() => {
        expect(tokenManager.clearTokens).toHaveBeenCalled()
      })
    })

    it('should throw error when no refresh token available', async () => {
      jest.spyOn(tokenManager, 'getRefreshToken').mockReturnValue(null)

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(result.current.mutateAsync()).rejects.toThrow('No refresh token available')
    })
  })

  describe('useForgotPassword', () => {
    it('should successfully send password reset email', async () => {
      const { result } = renderHook(() => useForgotPassword(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        email: 'test@example.com',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.message).toBe('Password reset email sent successfully')
      })
    })
  })

  describe('useResetPassword', () => {
    it('should successfully reset password', async () => {
      const { result } = renderHook(() => useResetPassword(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.message).toBe('Password reset successfully')
      })

      // Wait for redirect
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?reset=success')
      }, { timeout: 3000 })
    })

    it('should handle invalid reset token', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/reset-password`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Invalid or expired reset token',
                code: 'INVALID_TOKEN',
              },
            },
            { status: 400 }
          )
        })
      )

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(
        result.current.mutateAsync({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow()
    })
  })

  describe('useVerifyEmail', () => {
    it('should successfully verify email', async () => {
      const { result } = renderHook(() => useVerifyEmail(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await result.current.mutateAsync({
        token: 'valid-verification-token',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.message).toBe('Email verified successfully')
      })

      // Wait for redirect
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 3000 })
    })
  })

  describe('useUpdateProfile', () => {
    it('should optimistically update profile', async () => {
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('valid-token')
      
      // Set initial user data
      queryClient.setQueryData(['auth', 'user'], mockUser)

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      const updateData = { name: 'Updated Name' }
      result.current.mutate(updateData)

      // Check optimistic update
      const cachedUser = queryClient.getQueryData(['auth', 'user'])
      expect(cachedUser).toEqual({
        ...mockUser,
        ...updateData,
      })
    })

    it('should rollback on update failure', async () => {
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('valid-token')
      
      server.use(
        http.patch(`${API_BASE_URL}/users/profile`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Update failed',
                code: 'UPDATE_FAILED',
              },
            },
            { status: 400 }
          )
        })
      )

      // Set initial user data
      queryClient.setQueryData(['auth', 'user'], mockUser)

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>
            {children}
          </AllTheProviders>
        ),
      })

      await expect(
        result.current.mutateAsync({ name: 'Updated Name' })
      ).rejects.toThrow()

      await waitFor(() => {
        // Check rollback
        const cachedUser = queryClient.getQueryData(['auth', 'user'])
        expect(cachedUser).toEqual(mockUser)
      })
    })
  })
})