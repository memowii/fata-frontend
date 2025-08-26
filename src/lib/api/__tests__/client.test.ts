import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { api, tokenManager } from '../client'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

describe('API Client', () => {
  beforeEach(() => {
    // Clear any stored tokens
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('tokenManager', () => {
    describe('setTokens', () => {
      it('should store tokens in localStorage', () => {
        tokenManager.setTokens('access-token', 'refresh-token', 3600)
        
        expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token')
        expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token')
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'tokenExpiry',
          expect.stringMatching(/^\d+$/)
        )
      })

      it('should calculate expiry time correctly', () => {
        const now = Date.now()
        tokenManager.setTokens('access-token', 'refresh-token', 3600)
        
        const expiryCall = (localStorage.setItem as jest.Mock).mock.calls.find(
          call => call[0] === 'tokenExpiry'
        )
        
        const expiryTime = parseInt(expiryCall![1])
        // Should be approximately now + 3600 seconds (minus buffer)
        expect(expiryTime).toBeGreaterThan(now + 3500000)
        expect(expiryTime).toBeLessThan(now + 3600000)
      })
    })

    describe('getAccessToken', () => {
      it('should return stored access token', () => {
        (localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'accessToken') return 'stored-token'
          return null
        })
        
        expect(tokenManager.getAccessToken()).toBe('stored-token')
      })

      it('should return null if no token stored', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null)
        
        expect(tokenManager.getAccessToken()).toBeNull()
      })
    })

    describe('getRefreshToken', () => {
      it('should return stored refresh token', () => {
        (localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'refreshToken') return 'stored-refresh'
          return null
        })
        
        expect(tokenManager.getRefreshToken()).toBe('stored-refresh')
      })
    })

    describe('clearTokens', () => {
      it('should remove all tokens from storage', () => {
        tokenManager.clearTokens()
        
        expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
        expect(localStorage.removeItem).toHaveBeenCalledWith('tokenExpiry')
      })
    })

    describe('isTokenExpired', () => {
      it('should return true if no expiry time', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null)
        
        expect(tokenManager.isTokenExpired()).toBe(true)
      })

      it('should return true if token is expired', () => {
        const pastTime = Date.now() - 10000
        ;(localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'tokenExpiry') return pastTime.toString()
          return null
        })
        
        expect(tokenManager.isTokenExpired()).toBe(true)
      })

      it('should return false if token is still valid', () => {
        const futureTime = Date.now() + 10000
        ;(localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'tokenExpiry') return futureTime.toString()
          return null
        })
        
        expect(tokenManager.isTokenExpired()).toBe(false)
      })
    })

    describe('getTokenExpiry', () => {
      it('should return parsed expiry time', () => {
        const expiryTime = Date.now() + 3600000
        ;(localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'tokenExpiry') return expiryTime.toString()
          return null
        })
        
        expect(tokenManager.getTokenExpiry()).toBe(expiryTime)
      })

      it('should return null if no expiry stored', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null)
        
        expect(tokenManager.getTokenExpiry()).toBeNull()
      })
    })
  })

  describe('API Interceptors', () => {
    describe('Request Interceptor', () => {
      it('should add Authorization header when token exists', async () => {
        (localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'accessToken') return 'test-token'
          return null
        })

        let capturedHeaders: any
        server.use(
          http.get(`${API_BASE_URL}/test`, ({ request }) => {
            capturedHeaders = Object.fromEntries(request.headers.entries())
            return HttpResponse.json({ success: true })
          })
        )

        await api.get('/test')
        
        expect(capturedHeaders.authorization).toBe('Bearer test-token')
      })

      it('should not add Authorization header when no token', async () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null)

        let capturedHeaders: any
        server.use(
          http.get(`${API_BASE_URL}/test`, ({ request }) => {
            capturedHeaders = Object.fromEntries(request.headers.entries())
            return HttpResponse.json({ success: true })
          })
        )

        await api.get('/test')
        
        expect(capturedHeaders.authorization).toBeUndefined()
      })

      it('should not override existing Authorization header', async () => {
        (localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'accessToken') return 'stored-token'
          return null
        })

        let capturedHeaders: any
        server.use(
          http.get(`${API_BASE_URL}/test`, ({ request }) => {
            capturedHeaders = Object.fromEntries(request.headers.entries())
            return HttpResponse.json({ success: true })
          })
        )

        await api.get('/test', {
          headers: {
            Authorization: 'Bearer custom-token',
          },
        })
        
        expect(capturedHeaders.authorization).toBe('Bearer custom-token')
      })
    })

    describe('Response Interceptor', () => {
      it('should return successful response data', async () => {
        server.use(
          http.get(`${API_BASE_URL}/test`, () => {
            return HttpResponse.json({
              success: true,
              data: { message: 'Test data' },
            })
          })
        )

        const response = await api.get('/test')
        
        expect(response.success).toBe(true)
        expect(response.data).toEqual({ message: 'Test data' })
      })

      it('should handle error responses', async () => {
        server.use(
          http.get(`${API_BASE_URL}/test`, () => {
            return HttpResponse.json(
              {
                success: false,
                error: {
                  message: 'Test error',
                  code: 'TEST_ERROR',
                },
              },
              { status: 400 }
            )
          })
        )

        try {
          await api.get('/test')
          expect(true).toBe(false) // Should not reach here
        } catch (error: any) {
          expect(error.response.status).toBe(400)
          expect(error.response.data.error.message).toBe('Test error')
        }
      })

      it('should handle 401 errors and clear tokens', async () => {
        const clearTokensSpy = jest.spyOn(tokenManager, 'clearTokens')
        
        server.use(
          http.get(`${API_BASE_URL}/test`, () => {
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

        try {
          await api.get('/test')
        } catch (error: any) {
          expect(error.response.status).toBe(401)
          expect(clearTokensSpy).toHaveBeenCalled()
        }
      })

      it('should not clear tokens for 401 on auth endpoints', async () => {
        const clearTokensSpy = jest.spyOn(tokenManager, 'clearTokens')
        
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

        try {
          await api.post('/auth/login', {
            email: 'test@example.com',
            password: 'wrong',
          })
        } catch (error: any) {
          expect(error.response.status).toBe(401)
          expect(clearTokensSpy).not.toHaveBeenCalled()
        }
      })

      it('should retry failed requests after token refresh', async () => {
        let requestCount = 0
        const getAccessTokenSpy = jest.spyOn(tokenManager, 'getAccessToken')
        const getRefreshTokenSpy = jest.spyOn(tokenManager, 'getRefreshToken')
        const setTokensSpy = jest.spyOn(tokenManager, 'setTokens')
        
        getAccessTokenSpy.mockReturnValue('expired-token')
        getRefreshTokenSpy.mockReturnValue('valid-refresh-token')
        
        server.use(
          http.get(`${API_BASE_URL}/test`, () => {
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
            // Retry succeeds
            return HttpResponse.json({
              success: true,
              data: { message: 'Success after refresh' },
            })
          }),
          
          http.post(`${API_BASE_URL}/auth/refresh`, () => {
            return HttpResponse.json({
              success: true,
              data: {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 3600,
                user: { id: '123', email: 'test@example.com' },
              },
            })
          })
        )

        const response = await api.get('/test')
        
        expect(response.success).toBe(true)
        expect(response.data).toEqual({ message: 'Success after refresh' })
        expect(setTokensSpy).toHaveBeenCalledWith(
          'new-access-token',
          'new-refresh-token',
          3600
        )
      })
    })
  })

  describe('API Methods', () => {
    it('should make GET requests', async () => {
      server.use(
        http.get(`${API_BASE_URL}/users/123`, () => {
          return HttpResponse.json({
            success: true,
            data: { id: '123', name: 'Test User' },
          })
        })
      )

      const response = await api.get('/users/123')
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual({ id: '123', name: 'Test User' })
    })

    it('should make POST requests with data', async () => {
      let receivedData: any
      server.use(
        http.post(`${API_BASE_URL}/users`, async ({ request }) => {
          receivedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: { id: '456', ...receivedData },
          })
        })
      )

      const response = await api.post('/users', {
        name: 'New User',
        email: 'new@example.com',
      })
      
      expect(response.success).toBe(true)
      expect(receivedData).toEqual({
        name: 'New User',
        email: 'new@example.com',
      })
    })

    it('should make PUT requests', async () => {
      let receivedData: any
      server.use(
        http.put(`${API_BASE_URL}/users/123`, async ({ request }) => {
          receivedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: { id: '123', ...receivedData },
          })
        })
      )

      const response = await api.put('/users/123', {
        name: 'Updated User',
      })
      
      expect(response.success).toBe(true)
      expect(receivedData).toEqual({ name: 'Updated User' })
    })

    it('should make PATCH requests', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/users/123`, async ({ request }) => {
          const data = await request.json()
          return HttpResponse.json({
            success: true,
            data: { id: '123', ...data },
          })
        })
      )

      const response = await api.patch('/users/123', {
        name: 'Patched User',
      })
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual({
        id: '123',
        name: 'Patched User',
      })
    })

    it('should make DELETE requests', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/users/123`, () => {
          return HttpResponse.json({
            success: true,
            data: { message: 'User deleted' },
          })
        })
      )

      const response = await api.delete('/users/123')
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual({ message: 'User deleted' })
    })

    it('should handle query parameters', async () => {
      let capturedUrl: string = ''
      server.use(
        http.get(`${API_BASE_URL}/users`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({
            success: true,
            data: [],
          })
        })
      )

      await api.get('/users', {
        params: {
          page: 1,
          limit: 10,
          sort: 'name',
        },
      })
      
      const url = new URL(capturedUrl)
      expect(url.searchParams.get('page')).toBe('1')
      expect(url.searchParams.get('limit')).toBe('10')
      expect(url.searchParams.get('sort')).toBe('name')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, () => {
          return HttpResponse.error()
        })
      )

      try {
        await api.get('/test')
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Network Error')
      }
    })

    it('should handle timeout errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ success: true })
        })
      )

      try {
        await api.get('/test', { timeout: 50 })
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED')
      }
    }, 10000)

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, () => {
          return new HttpResponse('Invalid JSON', {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        })
      )

      try {
        await api.get('/test')
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('JSON')
      }
    })
  })
})