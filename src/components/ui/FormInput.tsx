'use client';

import { forwardRef, InputHTMLAttributes, memo, useId } from 'react';

/**
 * FormInput component props interface
 */
export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Left addon element (icon, text, etc.) */
  leftAddon?: React.ReactNode;
  /** Right addon element (icon, text, etc.) */
  rightAddon?: React.ReactNode;
  /** Whether to show the field in an error state */
  isInvalid?: boolean;
  /** Whether the field is in a loading state */
  isLoading?: boolean;
}

/**
 * Reusable form input component with error states and addons
 * 
 * @example
 * ```tsx
 * <FormInput
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   required
 * />
 * ```
 */
export const FormInput = memo(
  forwardRef<HTMLInputElement, FormInputProps>(
    (
      {
        label,
        error,
        helperText,
        required,
        leftAddon,
        rightAddon,
        isInvalid,
        isLoading,
        className = '',
        id: providedId,
        disabled,
        ...props
      },
      ref
    ) => {
      const generatedId = useId();
      const inputId = providedId || generatedId;
      const errorId = `${inputId}-error`;
      const helperId = `${inputId}-helper`;
      
      const hasError = Boolean(error) || isInvalid;
      const isDisabled = disabled || isLoading;

      const inputBaseStyles = [
        'block w-full rounded-lg border bg-background px-3 py-2.5',
        'text-foreground',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-200',
        'hover:border-primary/50',
        'text-sm',
      ].join(' ');

      const inputStateStyles = hasError
        ? 'border-destructive focus:border-destructive focus:ring-destructive animate-shake'
        : 'border-border focus:border-primary';

      const inputAddonStyles = [
        leftAddon && 'pl-10',
        rightAddon && 'pr-10',
      ].filter(Boolean).join(' ');

      const combinedInputClassName = [
        inputBaseStyles,
        inputStateStyles,
        inputAddonStyles,
        className,
      ].filter(Boolean).join(' ');

      return (
        <div className="w-full">
          {label && (
            <label
              htmlFor={inputId}
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {label}
              {required && (
                <span className="ml-1 text-destructive" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
          
          <div className="relative">
            {leftAddon && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-muted-foreground sm:text-sm">
                  {leftAddon}
                </span>
              </div>
            )}
            
            <input
              ref={ref}
              id={inputId}
              className={combinedInputClassName}
              disabled={isDisabled}
              aria-invalid={hasError}
              aria-describedby={
                [
                  error && errorId,
                  helperText && helperId,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              aria-required={required}
              {...props}
            />
            
            {rightAddon && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-muted-foreground sm:text-sm">
                  {rightAddon}
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <p
              id={errorId}
              className="mt-2 text-sm text-destructive animate-fade-in flex items-center gap-1"
              role="alert"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          
          {helperText && !error && (
            <p
              id={helperId}
              className="mt-2 text-sm text-muted-foreground"
            >
              {helperText}
            </p>
          )}
        </div>
      );
    }
  )
);

FormInput.displayName = 'FormInput';