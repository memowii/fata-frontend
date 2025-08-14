# TanStack Query v5 Setup Documentation

## Overview

This project implements a comprehensive TanStack Query v5 setup for managing server state in a Next.js 15 application. The implementation includes advanced features like optimistic updates, infinite scrolling, automatic token refresh, and SSR support.

## Architecture

### Core Components

1. **Query Client** (`src/lib/query/query-client.ts`)
   - Configured with optimized defaults
   - Global error handling
   - Exponential backoff retry logic
   - Smart cache management

2. **API Client** (`src/lib/api/client.ts`)
   - Axios instance with interceptors
   - Automatic token management
   - Request queuing during token refresh
   - Network error detection

3. **Query Keys** (`src/lib/query/query-keys.ts`)
   - Factory pattern for consistent key generation
   - Type-safe query and mutation keys
   - Hierarchical key structure

## Installation

```bash
# Install required dependencies
yarn add @tanstack/react-query axios
yarn add -D @tanstack/react-query-devtools
```

## Setup

### 1. Add QueryProvider to Root Layout

```tsx
// src/app/layout.tsx
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

### 2. Configure Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Usage Examples

### Authentication Hooks

```tsx
import { useLogin, useCurrentUser, useLogout } from '@/hooks/queries';

function LoginComponent() {
  const loginMutation = useLogin({
    onSuccess: (data) => {
      console.log('Login successful:', data);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const handleLogin = (credentials) => {
    loginMutation.mutate(credentials);
  };

  return (
    <button 
      onClick={() => handleLogin({ email, password })}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isPending ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

### Fetching Current User

```tsx
function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### Optimistic Updates

```tsx
import { useUpdateProfile } from '@/hooks/queries';

function ProfileEditor() {
  const updateMutation = useUpdateProfile({
    // Optimistic update is built into the hook
    onSuccess: (data) => {
      console.log('Profile updated:', data);
    },
  });

  const handleUpdate = (newData) => {
    updateMutation.mutate(newData);
  };

  return (
    <button onClick={() => handleUpdate({ name: 'New Name' })}>
      Update Profile
    </button>
  );
}
```

### Infinite Scrolling

```tsx
import { useInfiniteArticles, flattenInfiniteData } from '@/hooks/queries';

function ArticleList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteArticles({ category: 'tech' });

  const articles = flattenInfiniteData(data);

  return (
    <div>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          Load More
        </button>
      )}
    </div>
  );
}
```

### Server-Side Rendering (SSR)

```tsx
// app/dashboard/page.tsx
import { prefetchDashboard } from '@/lib/query/prefetch';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function DashboardPage() {
  const dehydratedState = await prefetchDashboard({});

  return (
    <HydrationBoundary state={dehydratedState}>
      <Dashboard />
    </HydrationBoundary>
  );
}
```

## Advanced Features

### Automatic Token Refresh

The setup includes automatic token refresh before expiry:

```tsx
import { useAutoRefreshToken } from '@/hooks/useAutoRefreshToken';

function App() {
  useAutoRefreshToken({
    refreshBeforeExpiry: 60000, // 1 minute before expiry
    onRefreshSuccess: () => console.log('Token refreshed'),
    onRefreshError: (error) => console.error('Refresh failed:', error),
  });

  return <YourApp />;
}
```

### Cache Management

```tsx
import { createCacheManager } from '@/lib/query/cache';
import { useQueryClient } from '@tanstack/react-query';

function CacheControls() {
  const queryClient = useQueryClient();
  const cacheManager = createCacheManager(queryClient);

  // Invalidate specific queries
  cacheManager.invalidateAuth();
  cacheManager.invalidateUser('userId');

  // Update specific items in cache
  cacheManager.updateListItem(
    queryKeys.article.lists(),
    'articleId',
    (article) => ({ ...article, title: 'Updated Title' })
  );

  // Get cache statistics
  const stats = cacheManager.getCacheStats();
  console.log('Cache stats:', stats);
}
```

### Error Handling

```tsx
import { getUserFriendlyMessage, parseErrorForDisplay } from '@/lib/query';

function ErrorDisplay({ error }) {
  const { title, message, details, isRetryable } = parseErrorForDisplay(error);

  return (
    <div className="error-container">
      <h3>{title}</h3>
      <p>{message}</p>
      {details && <p className="text-sm">{details}</p>}
      {isRetryable && <button onClick={retry}>Try Again</button>}
    </div>
  );
}
```

## API Endpoints

The following endpoints are configured:

- **Authentication**
  - `POST /auth/login` - User login
  - `POST /auth/register` - User registration
  - `POST /auth/logout` - User logout
  - `POST /auth/refresh` - Refresh access token
  - `POST /auth/forgot-password` - Request password reset
  - `POST /auth/reset-password` - Reset password
  - `POST /auth/verify-email` - Verify email address
  - `POST /auth/resend-verification` - Resend verification email

- **User**
  - `GET /auth/me` - Get current user
  - `PATCH /users/profile` - Update user profile

## Configuration Options

### Query Client Options

```typescript
{
  queries: {
    staleTime: 30 * 1000,        // 30 seconds
    gcTime: 5 * 60 * 1000,        // 5 minutes
    retry: 3,                     // Retry failed requests 3 times
    retryDelay: exponentialBackoff,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  },
  mutations: {
    retry: 1,                     // Retry mutations once
    throwOnError: false,
  }
}
```

### Token Management

Tokens are automatically managed with:
- Storage in localStorage
- Automatic refresh before expiry
- Request queuing during refresh
- Cross-tab synchronization

## Performance Optimizations

1. **Request Deduplication**: Identical requests are automatically deduplicated
2. **Selective Refetching**: Only stale queries are refetched
3. **Background Updates**: Data is updated in the background while showing cached data
4. **Optimistic Updates**: UI updates immediately, rolling back on error
5. **Intelligent Caching**: Different cache times for different data types
6. **Garbage Collection**: Automatic cleanup of unused cache entries

## Development Tools

### React Query DevTools

DevTools are automatically enabled in development:
- View all queries and their states
- Manually trigger refetches
- Inspect cache contents
- Monitor network requests

### Logging

Comprehensive logging in development mode:
- Query successes and failures
- Mutation operations
- Cache updates
- Network errors

## Best Practices

1. **Use Query Keys Factory**: Always use the centralized query keys
2. **Handle Loading States**: Provide feedback during data fetching
3. **Error Boundaries**: Wrap components with error boundaries
4. **Prefetch Critical Data**: Use SSR prefetching for important data
5. **Optimize Stale Times**: Adjust based on data update frequency
6. **Clean Up Subscriptions**: Properly clean up infinite queries
7. **Type Safety**: Leverage TypeScript for all queries and mutations

## Troubleshooting

### Common Issues

1. **Token Expired Errors**
   - Check if auto-refresh is enabled
   - Verify refresh token is valid
   - Check network connectivity

2. **Stale Data**
   - Adjust `staleTime` configuration
   - Manually invalidate queries after mutations
   - Check `refetchOnWindowFocus` setting

3. **Memory Leaks**
   - Ensure proper cleanup in useEffect
   - Check infinite query implementations
   - Monitor cache size with DevTools

## Migration Guide

If migrating from another state management solution:

1. Install TanStack Query dependencies
2. Add QueryProvider to root layout
3. Convert API calls to query/mutation hooks
4. Update components to use new hooks
5. Remove old state management code
6. Test thoroughly with DevTools

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Axios Documentation](https://axios-http.com/)

## Support

For issues or questions about this setup:
1. Check the troubleshooting section
2. Review example components in `src/components/examples/`
3. Inspect with React Query DevTools
4. Check console logs in development mode