'use client';

import { HTMLAttributes, forwardRef, memo } from 'react';

/**
 * Card component props interface
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Padding size variant */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show a shadow */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show a border */
  border?: boolean;
  /** Whether the card should have a hover effect */
  hoverable?: boolean;
  /** Glass morphism effect */
  glass?: boolean;
  /** Gradient background variant */
  gradient?: 'none' | 'primary' | 'mesh';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-2xl',
};

const gradientStyles = {
  none: '',
  primary: 'gradient-primary',
  mesh: 'gradient-mesh',
};

/**
 * Card container component for grouping related content
 * 
 * @example
 * ```tsx
 * <Card padding="lg" shadow="md">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(
    (
      {
        children,
        className = '',
        padding = 'md',
        shadow = 'md',
        border = true,
        hoverable = false,
        glass = false,
        gradient = 'none',
        ...props
      },
      ref
    ) => {
      const baseStyles = glass
        ? 'rounded-xl glass'
        : gradient !== 'none'
        ? `rounded-xl ${gradientStyles[gradient]}`
        : 'rounded-xl bg-card';
      
      const borderStyles = border && !glass
        ? 'border border-border'
        : '';
      
      const hoverStyles = hoverable
        ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:scale-[1.02]'
        : '';
      
      const combinedClassName = [
        baseStyles,
        paddingStyles[padding],
        shadowStyles[shadow],
        borderStyles,
        hoverStyles,
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div ref={ref} className={combinedClassName} {...props}>
          {children}
        </div>
      );
    }
  )
);

Card.displayName = 'Card';

/**
 * Card header component props
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border below the header */
  divider?: boolean;
}

/**
 * Card header component
 */
export const CardHeader = memo<CardHeaderProps>(
  ({ children, className = '', divider = false, ...props }) => {
    const dividerStyles = divider
      ? 'border-b border-border pb-4 mb-4'
      : '';
    
    return (
      <div
        className={`${dividerStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card body component
 */
export const CardBody = memo<HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }) => {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * Card footer component props
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border above the footer */
  divider?: boolean;
}

/**
 * Card footer component
 */
export const CardFooter = memo<CardFooterProps>(
  ({ children, className = '', divider = false, ...props }) => {
    const dividerStyles = divider
      ? 'border-t border-border pt-4 mt-4'
      : '';
    
    return (
      <div
        className={`${dividerStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';