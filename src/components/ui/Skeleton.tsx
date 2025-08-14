'use client';

import { memo } from 'react';

/**
 * Skeleton component props
 */
export interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius variant */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Animation variant */
  animation?: 'pulse' | 'shimmer' | 'none';
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const animationStyles = {
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
  none: '',
};

/**
 * Skeleton loading placeholder component
 * 
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton width="200px" height="20px" />
 * 
 * // Avatar skeleton
 * <Skeleton width={40} height={40} rounded="full" />
 * 
 * // Card skeleton
 * <Skeleton className="w-full h-48" rounded="lg" />
 * ```
 */
export const Skeleton = memo<SkeletonProps>(
  ({ 
    className = '', 
    width, 
    height, 
    rounded = 'md',
    animation = 'shimmer'
  }) => {
    const style: React.CSSProperties = {};
    
    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }

    return (
      <div
        className={`
          skeleton
          bg-muted
          ${roundedStyles[rounded]}
          ${animationStyles[animation]}
          ${className}
        `}
        style={style}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Form skeleton component for loading states
 */
export const FormSkeleton = memo(() => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton height={32} width="60%" className="mx-auto" />
        <Skeleton height={20} width="80%" className="mx-auto" />
      </div>
      
      {/* Form fields skeleton */}
      <div className="space-y-4">
        {/* Email field */}
        <div>
          <Skeleton height={16} width={60} className="mb-2" />
          <Skeleton height={44} className="w-full" />
        </div>
        
        {/* Password field */}
        <div>
          <Skeleton height={16} width={80} className="mb-2" />
          <Skeleton height={44} className="w-full" />
        </div>
        
        {/* Remember me & forgot password */}
        <div className="flex items-center justify-between">
          <Skeleton height={20} width={100} />
          <Skeleton height={20} width={120} />
        </div>
      </div>
      
      {/* Submit button skeleton */}
      <Skeleton height={48} className="w-full" rounded="lg" />
      
      {/* Footer link skeleton */}
      <div className="flex justify-center">
        <Skeleton height={20} width={200} />
      </div>
    </div>
  );
});

FormSkeleton.displayName = 'FormSkeleton';

/**
 * Card skeleton component
 */
export const CardSkeleton = memo<{ lines?: number }>(({ lines = 3 }) => {
  return (
    <div className="glass rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center space-x-3">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            height={12} 
            width={i === lines - 1 ? "80%" : "100%"} 
          />
        ))}
      </div>
      
      <div className="flex gap-2 pt-2">
        <Skeleton height={32} width={80} rounded="lg" />
        <Skeleton height={32} width={80} rounded="lg" />
      </div>
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

/**
 * List skeleton component
 */
export const ListSkeleton = memo<{ items?: number }>(({ items = 5 }) => {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton width={32} height={32} rounded="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="70%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
});

ListSkeleton.displayName = 'ListSkeleton';