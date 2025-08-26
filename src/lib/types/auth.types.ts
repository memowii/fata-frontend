/**
 * Core authentication types and interfaces for the application
 * These types define the shape of authentication-related data structures
 */

/**
 * User data transfer object representing a user in the system
 * Used for API responses and client-side user representation
 */
export interface UserDto {
  /** Unique identifier for the user */
  id: string;
  /** User's email address (unique) */
  email: string;
  /** User's display name */
  name: string;
  /** Whether the user's email has been verified */
  emailVerified: boolean;
  /** Timestamp of user account creation */
  createdAt: Date | string;
  /** Timestamp of last user data update */
  updatedAt: Date | string;
}

/**
 * Registration request data transfer object
 * Used when creating a new user account
 */
export interface RegisterDto {
  /** Email address for the new account */
  email: string;
  /** Password meeting security requirements */
  password: string;
  /** Display name for the user */
  name: string;
}

/**
 * Login request data transfer object
 * Used for user authentication
 */
export interface LoginDto {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Password reset request data transfer object
 */
export interface ForgotPasswordDto {
  /** Email address to send reset link to */
  email: string;
}

/**
 * Password reset confirmation data transfer object
 */
export interface ResetPasswordDto {
  /** Reset token from email */
  token: string;
  /** New password meeting security requirements */
  newPassword: string;
}

/**
 * Email verification data transfer object
 */
export interface VerifyEmailDto {
  /** Verification token from email */
  token: string;
}

/**
 * Refresh token request data transfer object
 */
export interface RefreshTokenDto {
  /** Refresh token for obtaining new access token */
  refreshToken: string;
}

/**
 * Authentication state representing the current user session
 */
export interface AuthState {
  /** Currently authenticated user or null if not authenticated */
  user: UserDto | null;
  /** JWT access token for API requests */
  accessToken: string | null;
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string | null;
  /** Type of token (typically 'Bearer') */
  tokenType: string;
  /** Token expiration time in ISO format or seconds */
  expiresIn: string;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is currently being checked */
  isLoading: boolean;
  /** Any authentication error messages */
  error: string | null;
}

/**
 * Authentication context value for React Context API
 */
export interface AuthContextValue extends AuthState {
  /** Login function */
  login: (credentials: LoginDto) => Promise<void>;
  /** Registration function */
  register: (userData: RegisterDto) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Refresh authentication tokens */
  refreshAuth: () => Promise<void>;
  /** Clear any authentication errors */
  clearError: () => void;
}

/**
 * Type guard to check if a value is a UserDto
 */
export function isUserDto(value: unknown): value is UserDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'name' in value &&
    'emailVerified' in value &&
    typeof (value as UserDto).id === 'string' &&
    typeof (value as UserDto).email === 'string' &&
    typeof (value as UserDto).name === 'string' &&
    typeof (value as UserDto).emailVerified === 'boolean'
  );
}

/**
 * Type for authentication credentials
 */
export type AuthCredentials = LoginDto;

/**
 * Type for user registration data
 */
export type RegistrationData = RegisterDto;

/**
 * Authentication status enum for better type safety
 */
export enum AuthStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error',
}

/**
 * User role enum for role-based access control
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * Extended user interface with role information
 */
export interface UserWithRole extends UserDto {
  /** User's role in the system */
  role?: UserRole;
}