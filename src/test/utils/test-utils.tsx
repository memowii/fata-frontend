import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Create a custom QueryClient for tests
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

// Provider wrapper for tests
export function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
}: AllTheProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { queryClient, ...renderOptions } = options || {}
  
  const user = userEvent.setup()
  
  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })

  return {
    ...result,
    user,
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { userEvent }

// Export our custom utilities
export { renderWithProviders as render }