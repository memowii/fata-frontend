/**
 * Zustand store types for state management
 * Defines the shape and actions for application stores
 */

import type { StateCreator } from 'zustand';
import type { UserDto, LoginDto, RegisterDto, AuthState } from './auth.types';
import type { AuthResponse } from './api.types';

/**
 * Auth store state interface
 * Manages authentication state and user session
 */
export interface AuthStore extends AuthState {
  // Actions
  /** Set the current user */
  setUser: (user: UserDto | null) => void;
  /** Set authentication tokens */
  setTokens: (accessToken: string, refreshToken: string, expiresIn: string) => void;
  /** Clear all authentication data */
  clearAuth: () => void;
  /** Set loading state */
  setLoading: (isLoading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Clear error message */
  clearError: () => void;
  
  // Async actions
  /** Login with credentials */
  login: (credentials: LoginDto) => Promise<AuthResponse>;
  /** Register new user */
  register: (userData: RegisterDto) => Promise<AuthResponse>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh authentication tokens */
  refreshTokens: () => Promise<void>;
  /** Verify email with token */
  verifyEmail: (token: string) => Promise<void>;
  /** Request password reset */
  forgotPassword: (email: string) => Promise<void>;
  /** Reset password with token */
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  /** Get current user profile */
  fetchProfile: () => Promise<void>;
  /** Update user profile */
  updateProfile: (data: Partial<UserDto>) => Promise<void>;
  
  // Computed getters
  /** Check if tokens are expired */
  isTokenExpired: () => boolean;
  /** Get remaining time until token expiration in seconds */
  getTokenExpiryTime: () => number;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
}

/**
 * App store for general application state
 */
export interface AppStore {
  // UI State
  /** Whether the sidebar is open */
  isSidebarOpen: boolean;
  /** Current theme */
  theme: 'light' | 'dark' | 'system';
  /** Active modal ID */
  activeModal: string | null;
  /** Toast notifications */
  notifications: Notification[];
  
  // Actions
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Set sidebar state */
  setSidebar: (isOpen: boolean) => void;
  /** Set theme */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  /** Open modal */
  openModal: (modalId: string) => void;
  /** Close modal */
  closeModal: () => void;
  /** Add notification */
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  /** Remove notification */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearNotifications: () => void;
}

/**
 * Notification type for toast messages
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** Notification type/severity */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Notification title */
  title: string;
  /** Optional notification message */
  message?: string;
  /** Duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Whether the notification can be dismissed */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Timestamp when notification was created */
  timestamp: number;
}

/**
 * Form store for managing form state
 * @template T - The shape of form data
 */
export interface FormStore<T = Record<string, unknown>> {
  /** Form data */
  data: T;
  /** Form validation errors */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Whether form has been touched */
  isDirty: boolean;
  /** Whether form is valid */
  isValid: boolean;
  
  // Actions
  /** Set form field value */
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple fields */
  setFields: (fields: Partial<T>) => void;
  /** Set field error */
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  /** Set multiple errors */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Reset form to initial state */
  reset: (initialData?: T) => void;
  /** Validate form */
  validate: () => boolean;
  /** Submit form */
  submit: () => Promise<void>;
}

/**
 * Session store for managing user sessions
 */
export interface SessionStore {
  /** Active sessions */
  sessions: SessionInfo[];
  /** Current session ID */
  currentSessionId: string | null;
  /** Last activity timestamp */
  lastActivity: number;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Whether session is about to expire */
  isSessionExpiring: boolean;
  
  // Actions
  /** Initialize session */
  initSession: (sessionId: string) => void;
  /** Update last activity */
  updateActivity: () => void;
  /** Check session expiry */
  checkSessionExpiry: () => void;
  /** Extend session */
  extendSession: () => void;
  /** End session */
  endSession: () => void;
  /** Get all sessions */
  fetchSessions: () => Promise<void>;
  /** Revoke a session */
  revokeSession: (sessionId: string) => Promise<void>;
}

/**
 * Session information
 */
export interface SessionInfo {
  /** Session ID */
  id: string;
  /** User agent */
  userAgent: string;
  /** IP address */
  ipAddress: string;
  /** Session creation time */
  createdAt: Date | string;
  /** Last activity time */
  lastActivity: Date | string;
  /** Whether this is the current session */
  isCurrent: boolean;
}

/**
 * Persistence options for store
 */
export interface PersistOptions {
  /** Storage name */
  name: string;
  /** Storage type */
  storage?: 'localStorage' | 'sessionStorage';
  /** Paths to persist */
  whitelist?: string[];
  /** Paths to exclude from persistence */
  blacklist?: string[];
  /** Version number for migrations */
  version?: number;
  /** Migration function */
  migrate?: (persistedState: unknown, version: number) => unknown;
}

/**
 * Store slice creator type
 * @template T - Store state type
 */
export type StoreSlice<T> = StateCreator<
  T,
  [],
  [],
  T
>;

/**
 * Combined store type for when slices are combined
 */
export interface CombinedStore extends AuthStore, AppStore, SessionStore {
  /** Reset all stores to initial state */
  resetAll: () => void;
}

/**
 * Store selector type for type-safe selectors
 * @template T - Store type
 * @template U - Selected value type
 */
export type StoreSelector<T, U> = (state: T) => U;

/**
 * Store mutator type for type-safe mutations
 * @template T - Store type
 */
export type StoreMutator<T> = (state: T) => void;

/**
 * Async store action type
 * @template T - Store type
 * @template U - Return type
 * @template V - Arguments type
 */
export type AsyncStoreAction<T, U = void, V = void> = (
  this: T,
  ...args: V extends void ? [] : [V]
) => Promise<U>;

/**
 * Store subscription type
 * @template T - Store type
 */
export type StoreSubscription<T> = (
  state: T,
  previousState: T
) => void;

/**
 * Middleware type for store
 * @template T - Store type
 */
export type StoreMiddleware<T> = (
  config: StateCreator<T>
) => StateCreator<T>;

/**
 * DevTools options for store
 */
export interface DevToolsOptions {
  /** Store name for DevTools */
  name?: string;
  /** Whether to enable DevTools */
  enabled?: boolean;
  /** Action sanitizer */
  actionSanitizer?: (action: unknown) => unknown;
  /** State sanitizer */
  stateSanitizer?: (state: unknown) => unknown;
}