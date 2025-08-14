/**
 * TanStack Query Provider for Next.js App Router
 * Provides query client to the entire application with SSR support
 */

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/query/query-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query Provider Component
 * Creates a stable query client instance and provides it to children
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client once per component lifecycle
  // This ensures we don't create a new client on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to ensure query provider is used
 * This can be used in components that require the query client
 */
export function useQueryProvider() {
  const client = QueryClient;
  if (!client) {
    throw new Error('useQueryProvider must be used within QueryProvider');
  }
  return client;
}