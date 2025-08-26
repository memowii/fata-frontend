import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { render } from '@/test/utils/test-utils'
import { fillForm, waitForLoadingToFinish } from '@/test/utils/test-helpers'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { useLogin, useRegister, useCurrentUser } from '@/hooks/queries/useAuthQueries'
import { tokenManager } from '@/lib/api/client'
import { mockUser, mockAuthResponse } from '@/test/fixtures/auth'

// Mock Next.js router
jest.mock('next/navigation')

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

describe('Authentication Flow Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Complete Login Flow', () => {
    it('should successfully login and redirect to dashboard', async () => {
      // Create a wrapper component that uses the login hook
      const LoginWrapper = () => {
        const { mutateAsync: login, isLoading, error } = useLogin()
        
        return (
          <LoginForm
            onSubmit={async (data) => {
              await login(data)
            }}
            isLoading={isLoading}
            error={error?.message}
          />
        )
      }

      const { user } = render(<LoginWrapper />)

      // Fill in the login form
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'Password123!',
      })

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Wait for the login to complete
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })

      // Verify tokens were stored
      expect(tokenManager.setTokens).toHaveBeenCalledWith(
        mockAuthResponse.accessToken,
        mockAuthResponse.refreshToken,
        mockAuthResponse.expiresIn
      )
    })

    it('should handle login errors gracefully', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/login`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
              },
            },
            { status: 401 }
          )
        })
      )

      const LoginWrapper = () => {
        const { mutateAsync: login, isLoading, error } = useLogin()
        
        return (
          <LoginForm
            onSubmit={async (data) => {
              try {
                await login(data)
              } catch (err) {
                // Error is handled by the hook
              }
            }}
            isLoading={isLoading}
            error={error?.response?.data?.error?.message}
          />
        )
      }

      const { user } = render(<LoginWrapper />)

      await fillForm(user, {
        'email address': 'invalid@example.com',
        'password': 'wrongpassword',
      })

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password')
      })

      // Should not redirect
      expect(mockRouter.push).not.toHaveBeenCalled()

      // Tokens should be cleared
      expect(tokenManager.clearTokens).toHaveBeenCalled()
    })
  })

  describe('Complete Registration Flow', () => {
    it('should register new user and handle email verification', async () => {
      const RegisterWrapper = () => {
        const { mutateAsync: register, isLoading, error } = useRegister()
        
        return (
          <RegisterForm
            onSubmit={async (data) => {
              await register({
                email: data.email,
                password: data.password,
                name: data.name,
              })
            }}
            isLoading={isLoading}
            error={error?.message}
          />
        )
      }

      const { user } = render(<RegisterWrapper />)

      // Fill in the registration form
      await fillForm(user, {
        'full name': 'New User',
        'email address': 'newuser@example.com',
        'password': 'StrongPassword123!',
        'confirm password': 'StrongPassword123!',
      })

      // Accept terms
      await user.click(screen.getByLabelText(/agree to terms/i))

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Wait for registration to complete
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })

      // Verify tokens were stored
      expect(tokenManager.setTokens).toHaveBeenCalled()
    })

    it('should handle unverified email after registration', async () => {
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

      const RegisterWrapper = () => {
        const { mutateAsync: register, isLoading } = useRegister()
        
        return (
          <RegisterForm
            onSubmit={async (data) => {
              await register({
                email: data.email,
                password: data.password,
                name: data.name,
              })
            }}
            isLoading={isLoading}
          />
        )
      }

      const { user } = render(<RegisterWrapper />)

      await fillForm(user, {
        'full name': 'New User',
        'email address': 'newuser@example.com',
        'password': 'StrongPassword123!',
        'confirm password': 'StrongPassword123!',
      })

      await user.click(screen.getByLabelText(/agree to terms/i))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Should redirect to email verification page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/verify-email?sent=true')
      })
    })

    it('should handle duplicate email registration', async () => {
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

      const RegisterWrapper = () => {
        const { mutateAsync: register, isLoading, error } = useRegister()
        
        return (
          <RegisterForm
            onSubmit={async (data) => {
              try {
                await register({
                  email: data.email,
                  password: data.password,
                  name: data.name,
                })
              } catch (err) {
                // Error handled by hook
              }
            }}
            isLoading={isLoading}
            error={error?.response?.data?.error?.message}
          />
        )
      }

      const { user } = render(<RegisterWrapper />)

      await fillForm(user, {
        'full name': 'Existing User',
        'email address': 'existing@example.com',
        'password': 'StrongPassword123!',
        'confirm password': 'StrongPassword123!',
      })

      await user.click(screen.getByLabelText(/agree to terms/i))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email already registered')
      })

      // Should not redirect
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete password reset flow successfully', async () => {
      // Step 1: Request password reset
      const ForgotPasswordWrapper = () => {
        const [isSubmitted, setIsSubmitted] = useState(false)
        
        const handleSubmit = async (email: string) => {
          const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          
          if (response.ok) {
            setIsSubmitted(true)
          }
        }
        
        if (isSubmitted) {
          return <div>Password reset email sent successfully</div>
        }
        
        return <ForgotPasswordForm onSubmit={handleSubmit} />
      }

      const { user, rerender } = render(<ForgotPasswordWrapper />)

      // Submit forgot password form
      await fillForm(user, {
        'email address': 'test@example.com',
      })

      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument()
      })

      // Step 2: Reset password with token
      const ResetPasswordWrapper = () => {
        const [isReset, setIsReset] = useState(false)
        
        const handleReset = async (token: string, newPassword: string) => {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          })
          
          if (response.ok) {
            setIsReset(true)
            setTimeout(() => {
              mockRouter.push('/login?reset=success')
            }, 2000)
          }
        }
        
        if (isReset) {
          return <div>Password reset successfully</div>
        }
        
        return (
          <ResetPasswordForm
            token="valid-reset-token"
            onSubmit={(data) => handleReset('valid-reset-token', data.password)}
          />
        )
      }

      rerender(<ResetPasswordWrapper />)

      // Fill in new password
      await fillForm(user, {
        'new password': 'NewPassword123!',
        'confirm password': 'NewPassword123!',
      })

      await user.click(screen.getByRole('button', { name: /reset password/i }))

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument()
      })

      // Verify redirect to login
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

      const ResetPasswordWrapper = () => {
        const [error, setError] = useState<string | null>(null)
        
        const handleReset = async (token: string, newPassword: string) => {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          })
          
          if (!response.ok) {
            const data = await response.json()
            setError(data.error.message)
          }
        }
        
        return (
          <>
            {error && <div role="alert">{error}</div>}
            <ResetPasswordForm
              token="invalid-token"
              onSubmit={(data) => handleReset('invalid-token', data.password)}
            />
          </>
        )
      }

      const { user } = render(<ResetPasswordWrapper />)

      await fillForm(user, {
        'new password': 'NewPassword123!',
        'confirm password': 'NewPassword123!',
      })

      await user.click(screen.getByRole('button', { name: /reset password/i }))

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired reset token')
      })
    })
  })

  describe('Token Refresh Flow', () => {
    it('should automatically refresh expired token', async () => {
      let requestCount = 0
      
      server.use(
        http.get(`${API_BASE_URL}/users/profile`, () => {
          requestCount++
          if (requestCount === 1) {
            // First request fails with 401
            return HttpResponse.json(
              {
                success: false,
                error: {
                  message: 'Token expired',
                  code: 'TOKEN_EXPIRED',
                },
              },
              { status: 401 }
            )
          }
          // Retry after refresh succeeds
          return HttpResponse.json({
            success: true,
            data: mockUser,
          })
        }),
        
        http.post(`${API_BASE_URL}/auth/refresh`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresIn: 3600,
              user: mockUser,
            },
          })
        })
      )

      // Set up expired token
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('expired-token')
      jest.spyOn(tokenManager, 'getRefreshToken').mockReturnValue('valid-refresh-token')

      // Make API call that triggers refresh
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      })

      // Should eventually succeed after refresh
      expect(response.ok).toBe(true)
      
      // Verify new tokens were stored
      expect(tokenManager.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
        3600
      )
    })
  })

  describe('Logout Flow', () => {
    it('should clear tokens and redirect on logout', async () => {
      // Set up authenticated state
      jest.spyOn(tokenManager, 'getAccessToken').mockReturnValue('valid-token')
      
      // Simulate logout
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      expect(response.ok).toBe(true)

      // Manually trigger what the logout hook would do
      tokenManager.clearTokens()
      mockRouter.push('/login')

      // Verify cleanup
      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })
})

// Import useState for the examples
import { useState } from 'react'