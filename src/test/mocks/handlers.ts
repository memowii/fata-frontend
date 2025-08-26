import { http, HttpResponse } from 'msw'
import { mockUser, mockAuthResponse, mockTokens } from '../fixtures/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const handlers = [
  // Login endpoint
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    // Simulate validation errors
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Email and password are required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

    // Simulate invalid credentials
    if (body.email === 'invalid@example.com') {
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
    }

    // Simulate successful login
    return HttpResponse.json({
      success: true,
      data: mockAuthResponse,
    })
  }),

  // Register endpoint
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as {
      email: string
      password: string
      name: string
    }

    // Simulate email already exists
    if (body.email === 'existing@example.com') {
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
    }

    // Simulate successful registration
    return HttpResponse.json({
      success: true,
      data: {
        ...mockAuthResponse,
        user: {
          ...mockUser,
          email: body.email,
          name: body.name,
          emailVerified: false,
        },
      },
    })
  }),

  // Current user endpoint
  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    // Simulate unauthorized
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    }

    // Simulate expired token
    if (authHeader === 'Bearer expired-token') {
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

    // Return current user
    return HttpResponse.json({
      success: true,
      data: mockUser,
    })
  }),

  // Logout endpoint
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    })
  }),

  // Refresh token endpoint
  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refreshToken: string }
    
    // Simulate invalid refresh token
    if (body.refreshToken === 'invalid-refresh-token') {
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
    }

    // Return new tokens
    return HttpResponse.json({
      success: true,
      data: {
        ...mockAuthResponse,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    })
  }),

  // Forgot password endpoint
  http.post(`${API_BASE_URL}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json() as { email: string }
    
    // Simulate user not found (but don't reveal this in production)
    if (body.email === 'notfound@example.com') {
      // In production, return success even if email doesn't exist
      return HttpResponse.json({
        success: true,
        data: {
          message: 'If an account exists with this email, a reset link has been sent',
        },
      })
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: 'Password reset email sent successfully',
      },
    })
  }),

  // Reset password endpoint
  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json() as { token: string; newPassword: string }
    
    // Simulate invalid token
    if (body.token === 'invalid-token') {
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
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
    })
  }),

  // Verify email endpoint
  http.post(`${API_BASE_URL}/auth/verify-email`, async ({ request }) => {
    const body = await request.json() as { token: string }
    
    // Simulate invalid token
    if (body.token === 'invalid-token') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid or expired verification token',
            code: 'INVALID_TOKEN',
          },
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
      },
    })
  }),

  // Resend verification email endpoint
  http.post(`${API_BASE_URL}/auth/resend-verification`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Verification email sent successfully',
      },
    })
  }),

  // Update profile endpoint
  http.patch(`${API_BASE_URL}/users/profile`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
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
    }

    const body = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockUser,
        ...body,
      },
    })
  }),
]

// Error simulation handlers for testing error scenarios
export const errorHandlers = {
  networkError: http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.error()
  }),
  
  serverError: http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'SERVER_ERROR',
        },
      },
      { status: 500 }
    )
  }),
  
  timeout: http.post(`${API_BASE_URL}/auth/login`, async () => {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return HttpResponse.json({})
  }),
}