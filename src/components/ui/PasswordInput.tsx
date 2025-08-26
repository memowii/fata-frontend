'use client';

import { forwardRef, memo, useState, useCallback } from 'react';
import { FormInput, FormInputProps } from './FormInput';

/**
 * PasswordInput component props interface
 */
export interface PasswordInputProps extends Omit<FormInputProps, 'type' | 'rightAddon'> {
  /** Whether to show the password toggle button */
  showToggle?: boolean;
  /** Custom icon for showing password */
  showIcon?: React.ReactNode;
  /** Custom icon for hiding password */
  hideIcon?: React.ReactNode;
}

/**
 * Default eye icon for showing password
 */
const EyeIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

/**
 * Default eye-off icon for hiding password
 */
const EyeOffIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

/**
 * Password input component with show/hide toggle functionality
 * 
 * @example
 * ```tsx
 * <PasswordInput
 *   label="Password"
 *   error={errors.password}
 *   showToggle
 *   required
 * />
 * ```
 */
export const PasswordInput = memo(
  forwardRef<HTMLInputElement, PasswordInputProps>(
    (
      {
        showToggle = true,
        showIcon = <EyeIcon />,
        hideIcon = <EyeOffIcon />,
        disabled,
        ...props
      },
      ref
    ) => {
      const [showPassword, setShowPassword] = useState(false);

      const handleToggle = useCallback(() => {
        setShowPassword((prev) => !prev);
      }, []);

      const toggleButton = showToggle ? (
        <button
          type="button"
          onClick={handleToggle}
          className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md p-1 transition-all duration-200 hover:scale-110"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          disabled={disabled}
        >
          {showPassword ? hideIcon : showIcon}
        </button>
      ) : undefined;

      return (
        <FormInput
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          rightAddon={toggleButton}
          disabled={disabled}
          {...props}
        />
      );
    }
  )
);

PasswordInput.displayName = 'PasswordInput';