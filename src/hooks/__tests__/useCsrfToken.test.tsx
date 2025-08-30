/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCsrfToken, useCsrfTokenForSubmit, useCsrfProtectionStatus } from '../useCsrfToken';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useCsrfToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should fetch CSRF token successfully', async () => {
    const mockToken = 'csrf-token-123';
    const mockExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken,
          expiresAt: mockExpiresAt,
        },
      }),
    });

    const { result } = renderHook(() => useCsrfToken(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.csrfToken).toBe(mockToken);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  });

  it('should handle CSRF token fetch error', async () => {
    const mockError = { message: 'Failed to fetch CSRF token' };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => mockError,
    });

    const { result } = renderHook(() => useCsrfToken(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.csrfToken).toBe(null);
  });

  it('should refresh token when needed', async () => {
    const mockToken1 = 'csrf-token-1';
    const mockToken2 = 'csrf-token-2';

    // First call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken1,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }),
    });

    // Second call (refresh)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken2,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useCsrfToken(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.csrfToken).toBe(mockToken1);
    });

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(result.current.csrfToken).toBe(mockToken2);
  });

  it('should detect expired tokens', async () => {
    const mockToken = 'csrf-token-123';
    const expiredTime = new Date(Date.now() - 10000).toISOString(); // 10 seconds ago

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken,
          expiresAt: expiredTime,
        },
      }),
    });

    const { result } = renderHook(() => useCsrfToken(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.csrfToken).toBe(mockToken);
    });

    expect(result.current.isExpired).toBe(true);
  });

  it('should get valid token, refreshing if needed', async () => {
    const mockToken1 = 'csrf-token-1';
    const mockToken2 = 'csrf-token-2';

    // First call - expired token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken1,
          expiresAt: new Date(Date.now() - 10000).toISOString(), // Expired
        },
      }),
    });

    // Refresh call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken2,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useCsrfToken(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.csrfToken).toBe(mockToken1);
    });

    let validToken: string;
    await act(async () => {
      validToken = await result.current.getValidToken();
    });

    expect(validToken!).toBe(mockToken2);
  });

  it('should be disabled when enabled is false', () => {
    const { result } = renderHook(() => useCsrfToken({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.csrfToken).toBe(null);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useCsrfTokenForSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should return CSRF token for form submission', async () => {
    const mockToken = 'csrf-token-123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useCsrfTokenForSubmit(), {
      wrapper: createWrapper(),
    });

    let token: string;
    await act(async () => {
      token = await result.current();
    });

    expect(token!).toBe(mockToken);
  });

  it('should throw user-friendly error on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCsrfTokenForSubmit(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current()).rejects.toThrow(
        'Unable to secure form submission. Please refresh the page and try again.'
      );
    });
  });
});

describe('useCsrfProtectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should report protection as available when token is loaded', async () => {
    const mockToken = 'csrf-token-123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          csrfToken: mockToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useCsrfProtectionStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });

    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasFailed).toBe(false);
  });

  it('should report protection as failed when token fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCsrfProtectionStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
    });

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('should report checking status while loading', () => {
    // Don't resolve the promise to keep it in loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    const { result } = renderHook(() => useCsrfProtectionStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isChecking).toBe(true);
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.hasFailed).toBe(false);
  });
});