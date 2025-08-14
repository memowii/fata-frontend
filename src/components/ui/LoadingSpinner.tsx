'use client';

import { memo } from 'react';

/**
 * Loading spinner size options
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * LoadingSpinner component props interface
 */
export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Color of the spinner (uses currentColor by default) */
  color?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * Loading spinner component for indicating loading states
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" aria-label="Loading data" />
 * ```
 */
export const LoadingSpinner = memo<LoadingSpinnerProps>(
  ({ size = 'md', className = '', 'aria-label': ariaLabel = 'Loading', color }) => {
    const sizeClasses = sizeMap[size];
    
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        role="status"
        aria-label={ariaLabel}
      >
        <div className="relative">
          <svg
            className={`animate-spin ${sizeClasses} ${color ? '' : 'text-primary'}`}
            style={color ? { color } : undefined}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className={`absolute inset-0 ${sizeClasses} animate-ping opacity-20`}>
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
        </div>
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';