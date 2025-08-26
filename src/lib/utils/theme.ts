/**
 * Theme utilities for consistent styling across the application
 */

/**
 * Combines class names, filtering out falsy values
 * @example
 * cn('base-class', isActive && 'active-class', 'another-class')
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Common button variants for consistent styling
 */
export const buttonVariants = {
  base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden group',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 focus-visible:ring-primary hover:-translate-y-0.5',
      secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 focus-visible:ring-secondary',
      ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
      danger: 'bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90 focus-visible:ring-destructive hover:-translate-y-0.5',
      success: 'bg-success text-success-foreground shadow-md hover:shadow-lg hover:bg-success/90 focus-visible:ring-success hover:-translate-y-0.5',
      warning: 'bg-warning text-warning-foreground shadow-md hover:shadow-lg hover:bg-warning/90 focus-visible:ring-warning hover:-translate-y-0.5',
    },
    size: {
      xs: 'h-7 px-2 text-xs rounded',
      sm: 'h-8 px-3 text-xs rounded-md',
      md: 'h-10 px-4 py-2 text-sm rounded-lg',
      lg: 'h-12 px-8 text-base rounded-lg',
      xl: 'h-14 px-10 text-lg rounded-xl',
    }
  }
};

/**
 * Common input styles for consistent form fields
 */
export const inputStyles = {
  base: 'block w-full rounded-lg border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-primary/50 text-sm',
  error: 'border-destructive focus:border-destructive focus:ring-destructive animate-shake',
  default: 'border-border focus:border-primary',
};

/**
 * Card styles for consistent container styling
 */
export const cardStyles = {
  base: 'rounded-xl transition-all duration-300',
  variants: {
    default: 'bg-card border border-border',
    glass: 'glass',
    gradient: {
      primary: 'gradient-primary text-white',
      mesh: 'gradient-mesh',
    },
    elevated: 'bg-card shadow-lg hover:shadow-xl',
  }
};

/**
 * Animation variants for consistent motion
 */
export const animationVariants = {
  fadeIn: 'animate-fade-in',
  fadeUp: 'animate-fade-up',
  fadeDown: 'animate-fade-down',
  scaleIn: 'animate-scale-in',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  ping: 'animate-ping',
  shake: 'animate-shake',
  glowPulse: 'animate-glow-pulse',
};

/**
 * Generates staggered animation delays for list items
 * @param index - The index of the item
 * @param baseDelay - Base delay in milliseconds
 * @returns CSS style object with animation delay
 */
export function staggerDelay(index: number, baseDelay: number = 50): React.CSSProperties {
  return {
    animationDelay: `${index * baseDelay}ms`,
  };
}

/**
 * Glass morphism styles
 */
export const glassStyles = {
  light: 'bg-white/80 backdrop-blur-xl border border-white/20',
  dark: 'bg-gray-900/80 backdrop-blur-xl border border-white/10',
  default: 'glass',
};

/**
 * Shadow styles for elevation
 */
export const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  glow: 'glow-md',
  glowLg: 'glow-lg',
};

/**
 * Text gradient styles
 */
export const textGradientStyles = {
  primary: 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
  success: 'bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent',
  warning: 'bg-gradient-to-r from-warning to-warning/70 bg-clip-text text-transparent',
  danger: 'bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent',
  rainbow: 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent',
};