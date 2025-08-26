'use client';

import { memo, useMemo } from 'react';
import { checkPasswordStrength, PasswordStrength } from '@/lib/types/validation.schemas';

/**
 * PasswordStrengthIndicator component props
 */
export interface PasswordStrengthIndicatorProps {
  /** Password to check strength for */
  password: string;
  /** Whether to show feedback messages */
  showFeedback?: boolean;
  /** Whether to show the strength label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: 'bg-destructive',
  fair: 'bg-warning',
  good: 'bg-primary',
  strong: 'bg-success',
};

const strengthLabels: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

/**
 * Visual password strength indicator component
 * 
 * @example
 * ```tsx
 * <PasswordStrengthIndicator
 *   password={password}
 *   showFeedback
 *   showLabel
 * />
 * ```
 */
export const PasswordStrengthIndicator = memo<PasswordStrengthIndicatorProps>(
  ({ password, showFeedback = true, showLabel = true, className = '' }) => {
    const strengthData = useMemo(() => {
      if (!password) {
        return {
          strength: PasswordStrength.WEAK,
          score: 0,
          feedback: [],
        };
      }
      return checkPasswordStrength(password);
    }, [password]);

    const { strength, score, feedback } = strengthData;
    
    // Calculate how many bars to fill (out of 4)
    const filledBars = Math.ceil((score / 10) * 4);
    
    if (!password) {
      return null;
    }

    return (
      <div className={`space-y-2 animate-fade-in ${className}`}>
        {/* Strength bars */}
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-out ${
                bar <= filledBars
                  ? `${strengthColors[strength]} shadow-sm animate-scale-in`
                  : 'bg-muted'
              }`}
              style={{
                animationDelay: bar <= filledBars ? `${bar * 50}ms` : '0ms',
              }}
              role="progressbar"
              aria-valuenow={bar <= filledBars ? 1 : 0}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-label={`Password strength bar ${bar} of 4`}
            />
          ))}
          
          {showLabel && (
            <span
              className={`ml-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                strength === PasswordStrength.WEAK
                  ? 'text-destructive'
                  : strength === PasswordStrength.FAIR
                  ? 'text-warning'
                  : strength === PasswordStrength.GOOD
                  ? 'text-primary'
                  : 'text-success'
              }`}
            >
              {strengthLabels[strength]}
            </span>
          )}
        </div>
        
        {/* Feedback messages */}
        {showFeedback && feedback.length > 0 && (
          <ul className="space-y-1 animate-fade-up">
            {feedback.map((message, index) => (
              <li
                key={index}
                className="flex items-start text-xs text-muted-foreground"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <svg className="mr-1.5 mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';