import { screen, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { tokenManager } from '@/lib/api/client'

/**
 * Wait for an element to be removed from the DOM
 */
export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
  options?: { timeout?: number }
) => {
  await waitFor(
    () => {
      expect(callback()).not.toBeInTheDocument()
    },
    { timeout: options?.timeout || 3000 }
  )
}

/**
 * Wait for loading state to complete
 */
export const waitForLoadingToFinish = async () => {
  const loadingElements = screen.queryAllByText(/loading/i)
  if (loadingElements.length > 0) {
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))
  }
}

/**
 * Mock successful authentication
 */
export const mockAuthentication = (token = 'mock-access-token') => {
  const setTokensSpy = jest.spyOn(tokenManager, 'setTokens')
  const getAccessTokenSpy = jest.spyOn(tokenManager, 'getAccessToken')
  
  getAccessTokenSpy.mockReturnValue(token)
  
  return {
    setTokensSpy,
    getAccessTokenSpy,
    cleanup: () => {
      setTokensSpy.mockRestore()
      getAccessTokenSpy.mockRestore()
    },
  }
}

/**
 * Mock unauthenticated state
 */
export const mockUnauthenticated = () => {
  const getAccessTokenSpy = jest.spyOn(tokenManager, 'getAccessToken')
  const clearTokensSpy = jest.spyOn(tokenManager, 'clearTokens')
  
  getAccessTokenSpy.mockReturnValue(null)
  
  return {
    getAccessTokenSpy,
    clearTokensSpy,
    cleanup: () => {
      getAccessTokenSpy.mockRestore()
      clearTokensSpy.mockRestore()
    },
  }
}

/**
 * Create a test query client with specific defaults
 */
export const createQueryClient = (overrides = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        ...overrides,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Fill form inputs helper
 */
export const fillForm = async (
  user: any,
  fields: Record<string, string>
) => {
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(input)
    await user.type(input, value)
  }
}

/**
 * Assert form validation errors
 */
export const expectValidationError = (fieldName: string, errorMessage: string) => {
  const input = screen.getByLabelText(new RegExp(fieldName, 'i'))
  const errorElement = screen.getByText(errorMessage)
  
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(errorElement).toBeInTheDocument()
}

/**
 * Mock localStorage
 */
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get store() {
      return { ...store }
    },
  }
}

/**
 * Mock sessionStorage
 */
export const createSessionStorageMock = () => {
  return createLocalStorageMock()
}

/**
 * Assert accessibility attributes
 */
export const expectAccessibleForm = (formElement: HTMLElement) => {
  // Check for proper ARIA attributes
  const requiredInputs = formElement.querySelectorAll('[required]')
  requiredInputs.forEach(input => {
    expect(input).toHaveAttribute('aria-required', 'true')
  })
  
  // Check for labels
  const inputs = formElement.querySelectorAll('input')
  inputs.forEach(input => {
    if (input.type !== 'hidden') {
      const label = formElement.querySelector(`label[for="${input.id}"]`)
      expect(label).toBeInTheDocument()
    }
  })
  
  // Check for error messages association
  const invalidInputs = formElement.querySelectorAll('[aria-invalid="true"]')
  invalidInputs.forEach(input => {
    expect(input).toHaveAttribute('aria-describedby')
  })
}

/**
 * Wait for debounced input
 */
export const waitForDebounce = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock API error response
 */
export const createApiError = (message: string, code = 'ERROR', status = 400) => ({
  response: {
    status,
    data: {
      success: false,
      error: {
        message,
        code,
      },
    },
  },
})

/**
 * Assert button state
 */
export const expectButtonState = (
  button: HTMLElement,
  state: 'enabled' | 'disabled' | 'loading'
) => {
  switch (state) {
    case 'enabled':
      expect(button).toBeEnabled()
      expect(button).not.toHaveAttribute('aria-busy')
      break
    case 'disabled':
      expect(button).toBeDisabled()
      break
    case 'loading':
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      break
  }
}

/**
 * Get form values helper
 */
export const getFormValues = (form: HTMLFormElement): Record<string, any> => {
  const formData = new FormData(form)
  const values: Record<string, any> = {}
  
  formData.forEach((value, key) => {
    if (values[key]) {
      values[key] = Array.isArray(values[key]) 
        ? [...values[key], value]
        : [values[key], value]
    } else {
      values[key] = value
    }
  })
  
  return values
}