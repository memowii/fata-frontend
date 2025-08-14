/**
 * Example Component: Infinite Scrolling with TanStack Query
 * Demonstrates infinite queries with virtual scrolling and loading states
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteArticles, flattenInfiniteData, hasMorePages } from '@/hooks/queries';

/**
 * Infinite Scroll Articles Example
 */
export function InfiniteScrollExample() {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteArticles(
    { category: 'technology' },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Flatten the pages into a single array
  const articles = flattenInfiniteData(data);
  const canLoadMore = hasMorePages(data);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Manual load more handler
  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <ArticleSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">
          Error loading articles: {error?.message}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No articles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article: any) => (
        <ArticleCard key={article.id} article={article} />
      ))}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-10" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading more articles...</p>
        </div>
      )}

      {/* Manual load more button (fallback) */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load More
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && articles.length > 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">You&apos;ve reached the end!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Article Card Component
 */
function ArticleCard({ article }: { article: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
      <p className="text-gray-600 mb-4">{article.excerpt}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {new Date(article.createdAt).toLocaleDateString()}
        </span>
        <button className="text-blue-500 hover:text-blue-600">
          Read More →
        </button>
      </div>
    </div>
  );
}

/**
 * Article Skeleton Component
 */
function ArticleSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}

/**
 * Virtual Scrolling Example (with react-window)
 * Note: You would need to install react-window for this
 */
export function VirtualScrollExample() {
  // This is a placeholder for virtual scrolling implementation
  // You would use react-window or react-virtual for large lists
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Virtual Scrolling</h2>
      <p className="text-gray-600">
        For very large lists, consider using virtual scrolling libraries like:
      </p>
      <ul className="list-disc list-inside mt-2 text-gray-600">
        <li>react-window</li>
        <li>react-virtual</li>
        <li>react-virtualized</li>
      </ul>
      <pre className="mt-4 p-4 bg-gray-100 rounded overflow-x-auto">
        <code>{`
// Example with react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={articles.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ArticleCard article={articles[index]} />
    </div>
  )}
</FixedSizeList>
        `}</code>
      </pre>
    </div>
  );
}