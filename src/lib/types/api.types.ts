/**
 * API request and response types for client-server communication
 * These types ensure type safety for all API interactions
 */

import type { UserDto } from './auth.types';

/**
 * Generic API response wrapper for consistent response structure
 * @template T - The type of data being returned
 */
export interface ApiResponse<T = unknown> {
  /** Response data payload */
  data?: T;
  /** Success/info message */
  message?: string;
  /** Whether the request was successful */
  success: boolean;
  /** Error details if request failed */
  error?: ApiError;
  /** Response timestamp */
  timestamp?: string;
}

/**
 * API error structure for consistent error handling
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** HTTP status code */
  statusCode?: number;
  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * Authentication response returned after successful login/register
 */
export interface AuthResponse {
  /** Authenticated user information */
  user: UserDto;
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** Token type (typically 'Bearer') */
  tokenType: 'Bearer';
  /** Access token expiration time */
  expiresIn: '15m' | string;
  /** Optional success message */
  message?: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  /** New JWT access token */
  accessToken: string;
  /** New JWT refresh token */
  refreshToken: string;
  /** Token type (typically 'Bearer') */
  tokenType: 'Bearer';
  /** Access token expiration time */
  expiresIn: '15m' | string;
}

/**
 * Generic message response for operations that don't return data
 */
export interface MessageResponse {
  /** Response message */
  message: string;
}

/**
 * Paginated response for list endpoints
 * @template T - The type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrevious: boolean;
}

/**
 * Request configuration for API calls
 */
export interface ApiRequestConfig {
  /** Request headers */
  headers?: Record<string, string>;
  /** Request method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include credentials */
  credentials?: RequestCredentials;
  /** AbortController signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  /** Endpoint URL path */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Description of the endpoint */
  description?: string;
}

/**
 * API endpoints enum for type-safe endpoint references
 */
export enum ApiEndpoints {
  // Auth endpoints
  LOGIN = '/auth/login',
  REGISTER = '/auth/register',
  LOGOUT = '/auth/logout',
  REFRESH_TOKEN = '/auth/refresh',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  VERIFY_EMAIL = '/auth/verify-email',
  
  // User endpoints
  USER_PROFILE = '/users/profile',
  DELETE_ACCOUNT = '/users/account',
  
  // Other endpoints can be added here
}

/**
 * HTTP status codes enum for consistent status handling
 */
export enum HttpStatus {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  
  // Client errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Type guard to check if a response is an AuthResponse
 */
export function isAuthResponse(value: unknown): value is AuthResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user' in value &&
    'accessToken' in value &&
    'refreshToken' in value &&
    'tokenType' in value &&
    'expiresIn' in value
  );
}

/**
 * Type guard to check if a response is an ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  );
}

/**
 * Utility type for extracting data type from ApiResponse
 */
export type ExtractApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Utility type for API method that returns a promise
 */
export type ApiMethod<TRequest = unknown, TResponse = unknown> = (
  data: TRequest,
  config?: ApiRequestConfig
) => Promise<ApiResponse<TResponse>>;

/**
 * Error codes for consistent error handling across the application
 */
export enum ApiErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}