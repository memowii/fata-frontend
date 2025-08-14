'use client';

import { memo, useCallback } from 'react';

/**
 * Alert component variants
 */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert component props interface
 */
export interface AlertProps {
  /** Alert variant determining color scheme */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert message/description */
  children: React.ReactNode;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Icon to display (uses default based on variant if not provided) */
  icon?: React.ReactNode;
  /** Whether to show the icon */
  showIcon?: boolean;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  success: {
    container: 'bg-success/10 border-success/20 text-foreground dark:bg-success/15 dark:border-success/30 backdrop-blur-sm',
    icon: 'text-success',
  },
  error: {
    container: 'bg-destructive/10 border-destructive/20 text-foreground dark:bg-destructive/15 dark:border-destructive/30 backdrop-blur-sm',
    icon: 'text-destructive',
  },
  warning: {
    container: 'bg-warning/10 border-warning/20 text-foreground dark:bg-warning/15 dark:border-warning/30 backdrop-blur-sm',
    icon: 'text-warning',
  },
  info: {
    container: 'bg-primary/10 border-primary/20 text-foreground dark:bg-primary/15 dark:border-primary/30 backdrop-blur-sm',
    icon: 'text-primary',
  },
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Alert component for displaying messages with different severity levels
 * 
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!" dismissible onDismiss={handleDismiss}>
 *   Your changes have been saved.
 * </Alert>
 * ```
 */
export const Alert = memo<AlertProps>(
  ({
    variant = 'info',
    title,
    children,
    dismissible = false,
    onDismiss,
    className = '',
    icon,
    showIcon = true,
  }) => {
    const handleDismiss = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    const styles = variantStyles[variant];
    const displayIcon = icon || defaultIcons[variant];

    return (
      <div
        className={`relative rounded-xl border-2 p-4 animate-fade-in transition-all duration-300 ${styles.container} ${className}`}
        role="alert"
      >
        <div className="flex">
          {showIcon && (
            <div className={`flex-shrink-0 ${styles.icon}`} aria-hidden="true">
              {displayIcon}
            </div>
          )}
          
          <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
            {title && (
              <h3 className="text-sm font-medium mb-1">{title}</h3>
            )}
            <div className="text-sm">{children}</div>
          </div>
          
          {dismissible && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={handleDismiss}
                className={`inline-flex rounded-lg p-1.5 transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  variant === 'success'
                    ? 'text-success hover:bg-success/20 focus-visible:ring-success'
                    : variant === 'error'
                    ? 'text-destructive hover:bg-destructive/20 focus-visible:ring-destructive'
                    : variant === 'warning'
                    ? 'text-warning hover:bg-warning/20 focus-visible:ring-warning'
                    : 'text-primary hover:bg-primary/20 focus-visible:ring-primary'
                }`}
                aria-label="Dismiss"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';