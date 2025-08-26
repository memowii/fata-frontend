'use client';

import { memo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * LoadingPage component props
 */
export interface LoadingPageProps {
  /** Loading message to display */
  message?: string;
  /** Additional description text */
  description?: string;
  /** Whether to show with full page overlay */
  fullScreen?: boolean;
  /** Whether to show with glass morphism effect */
  glass?: boolean;
}

/**
 * Full page loading component with beautiful animations
 * 
 * @example
 * ```tsx
 * <LoadingPage message="Loading your content..." fullScreen />
 * ```
 */
export const LoadingPage = memo<LoadingPageProps>(
  ({ 
    message = 'Loading...', 
    description,
    fullScreen = true,
    glass = true 
  }) => {
    const containerClasses = fullScreen
      ? 'fixed inset-0 z-50'
      : 'relative w-full h-full min-h-[400px]';

    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        {/* Background overlay for full screen */}
        {fullScreen && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
        )}
        
        {/* Loading content */}
        <div className="relative animate-fade-up">
          <div className={`${glass ? 'glass' : 'bg-card'} rounded-2xl p-8 shadow-2xl`}>
            <div className="flex flex-col items-center space-y-6">
              {/* Animated logo/spinner container */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
                <div className="relative">
                  <LoadingSpinner size="xl" />
                </div>
              </div>
              
              {/* Loading text */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground animate-pulse">
                  {message}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {description}
                  </p>
                )}
              </div>
              
              {/* Loading dots animation */}
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LoadingPage.displayName = 'LoadingPage';

/**
 * Inline loading component for content areas
 */
export const InlineLoading = memo<{ message?: string }>(
  ({ message = 'Loading...' }) => {
    return (
      <div className="flex items-center justify-center py-8 animate-fade-in">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    );
  }
);

InlineLoading.displayName = 'InlineLoading';

/**
 * Loading overlay component for sections
 */
export const LoadingOverlay = memo<{ visible?: boolean; message?: string }>(
  ({ visible = true, message = 'Processing...' }) => {
    if (!visible) return null;

    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-fade-in">
        <div className="glass rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium text-foreground">
              {message}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';