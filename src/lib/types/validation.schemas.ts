/**
 * Zod validation schemas for form validation and data integrity
 * Ensures data meets requirements before sending to API
 */

import { z } from 'zod';

/**
 * Password validation regex patterns
 */
const PASSWORD_REGEX = {
  /** At least one uppercase letter */
  UPPERCASE: /[A-Z]/,
  /** At least one lowercase letter */
  LOWERCASE: /[a-z]/,
  /** At least one number */
  NUMBER: /\d/,
  /** At least one special character - matches backend regex */
  SPECIAL: /[@$!%*?&]/,
  /** Only allowed characters - matches backend validation */
  ALLOWED_CHARS: /^[A-Za-z\d@$!%*?&]+$/,
};

/**
 * Custom password validation with specific requirements
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must not exceed 100 characters')
  .refine(
    (password) => PASSWORD_REGEX.ALLOWED_CHARS.test(password),
    'Password can only contain letters, numbers, and special characters (@$!%*?&)'
  )
  .refine(
    (password) => PASSWORD_REGEX.UPPERCASE.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => PASSWORD_REGEX.LOWERCASE.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => PASSWORD_REGEX.NUMBER.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => PASSWORD_REGEX.SPECIAL.test(password),
    'Password must contain at least one special character (@$!%*?&)'
  );

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

/**
 * Name validation schema
 */
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .refine(
    (name) => /^[a-zA-Z\s'-]+$/.test(name),
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Email verification validation schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Profile update validation schema
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
  confirmNewPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword || data.confirmNewPassword) {
      return data.currentPassword && data.currentPassword.length > 0;
    }
    return true;
  },
  {
    message: 'Current password is required to change password',
    path: ['currentPassword'],
  }
).refine(
  (data) => {
    if (data.newPassword && data.confirmNewPassword) {
      return data.newPassword === data.confirmNewPassword;
    }
    return true;
  },
  {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }
);

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(
  (data) => data.newPassword !== data.currentPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  }
);

/**
 * Token validation schema
 */
export const tokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  tokenType: z.literal('Bearer'),
  expiresIn: z.string(),
});

/**
 * User data validation schema
 */
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: emailSchema,
  name: nameSchema,
  emailVerified: z.boolean(),
  createdAt: z.union([z.string().datetime(), z.date()]),
  updatedAt: z.union([z.string().datetime(), z.date()]),
});

/**
 * Type inference from schemas
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type TokenData = z.infer<typeof tokenSchema>;
export type UserData = z.infer<typeof userSchema>;

/**
 * Validation error type for form field errors
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Helper function to extract validation errors from Zod error
 */
export function extractValidationErrors<T>(
  error: z.ZodError
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      const field = err.path[0] as keyof T;
      if (!errors[field]) {
        errors[field] = err.message;
      }
    }
  });
  
  return errors;
}

/**
 * Safe parse function with typed error handling
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationErrors<T> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: extractValidationErrors<T>(result.error),
  };
}

/**
 * Password strength checker
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Check for invalid characters first
  if (!PASSWORD_REGEX.ALLOWED_CHARS.test(password)) {
    feedback.push('Contains invalid characters. Only use letters, numbers, and @$!%*?&');
    // Return early with weak strength if invalid characters are present
    return { strength: PasswordStrength.WEAK, score: 0, feedback };
  }
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Character type checks
  if (PASSWORD_REGEX.UPPERCASE.test(password)) score++;
  else feedback.push('Add uppercase letters');
  
  if (PASSWORD_REGEX.LOWERCASE.test(password)) score++;
  else feedback.push('Add lowercase letters');
  
  if (PASSWORD_REGEX.NUMBER.test(password)) score++;
  else feedback.push('Add numbers');
  
  if (PASSWORD_REGEX.SPECIAL.test(password)) score++;
  else feedback.push('Add special characters (@$!%*?&)');
  
  // Determine strength
  let strength: PasswordStrength;
  if (score < 4) {
    strength = PasswordStrength.WEAK;
  } else if (score < 6) {
    strength = PasswordStrength.FAIR;
  } else if (score < 8) {
    strength = PasswordStrength.GOOD;
  } else {
    strength = PasswordStrength.STRONG;
  }
  
  return { strength, score, feedback };
}