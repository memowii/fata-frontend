import type { UserDto } from '@/lib/types/auth.types'
import type { AuthResponse } from '@/lib/types/api.types'

export const mockUser: UserDto = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockUnverifiedUser: UserDto = {
  ...mockUser,
  emailVerified: false,
}

export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
}

export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  ...mockTokens,
}

export const mockLoginCredentials = {
  email: 'test@example.com',
  password: 'Password123!',
}

export const mockRegisterData = {
  email: 'newuser@example.com',
  password: 'Password123!',
  name: 'New User',
}

export const mockInvalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
}

export const mockWeakPassword = {
  email: 'test@example.com',
  password: '123',
}

export const createMockUser = (overrides?: Partial<UserDto>): UserDto => ({
  ...mockUser,
  ...overrides,
})

export const createMockAuthResponse = (
  overrides?: Partial<AuthResponse>
): AuthResponse => ({
  ...mockAuthResponse,
  ...overrides,
})