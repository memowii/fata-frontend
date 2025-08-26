'use client';

import { ButtonHTMLAttributes, forwardRef, memo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Button component variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button component sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props interface
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Loading state - shows spinner and disables interaction */
  isLoading?: boolean;
  /** Loading text to display alongside spinner */
  loadingText?: string;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 hover:-translate-y-0.5',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200',
  ghost:
    'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200',
  danger:
    'bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 hover:-translate-y-0.5',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-md font-medium',
  md: 'h-10 px-4 py-2 text-sm rounded-lg font-medium',
  lg: 'h-12 px-8 text-base rounded-lg font-semibold',
};

/**
 * Reusable button component with multiple variants and states
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" isLoading={loading}>
 *   Submit
 * </Button>
 * ```
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        children,
        className = '',
        variant = 'primary',
        size = 'md',
        fullWidth = false,
        isLoading = false,
        loadingText,
        leftIcon,
        rightIcon,
        disabled,
        type = 'button',
        ...props
      },
      ref
    ) => {
      const isDisabled = disabled || isLoading;

      const baseStyles =
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-offset-background disabled:cursor-not-allowed relative overflow-hidden group';

      const widthStyles = fullWidth ? 'w-full' : '';

      const combinedClassName = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <button
          ref={ref}
          type={type}
          className={combinedClassName}
          disabled={isDisabled}
          aria-busy={isLoading}
          aria-disabled={isDisabled}
          {...props}
        >
          {isLoading && (
            <LoadingSpinner
              size="sm"
              className="mr-2"
              aria-label="Loading"
            />
          )}
          {!isLoading && leftIcon && (
            <span className="mr-2 inline-flex">{leftIcon}</span>
          )}
          {isLoading && loadingText ? loadingText : children}
          {!isLoading && rightIcon && (
            <span className="ml-2 inline-flex">{rightIcon}</span>
          )}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';