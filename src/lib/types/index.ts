/**
 * Central export file for all type definitions
 * Import types from this file for consistent usage across the application
 */

// Auth types
export type {
  UserDto,
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RefreshTokenDto,
  AuthState,
  AuthContextValue,
  AuthCredentials,
  RegistrationData,
  UserWithRole,
} from './auth.types';

export {
  AuthStatus,
  UserRole,
  isUserDto,
} from './auth.types';

// API types
export type {
  ApiResponse,
  ApiError,
  AuthResponse,
  RefreshTokenResponse,
  MessageResponse,
  PaginatedResponse,
  ApiRequestConfig,
  ApiEndpoint,
  ExtractApiResponseData,
  ApiMethod,
} from './api.types';

export {
  ApiEndpoints,
  HttpStatus,
  ApiErrorCode,
  isAuthResponse,
  isApiError,
} from './api.types';

// Validation schemas and types
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  changePasswordSchema,
  tokenSchema,
  userSchema,
  extractValidationErrors,
  safeParse,
  checkPasswordStrength,
  PasswordStrength,
} from './validation.schemas';

export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  VerifyEmailFormData,
  UpdateProfileFormData,
  ChangePasswordFormData,
  TokenData,
  UserData,
  ValidationErrors,
} from './validation.schemas';

// Store types
export type {
  AuthStore,
  AppStore,
  Notification,
  FormStore,
  SessionStore,
  SessionInfo,
  PersistOptions,
  StoreSlice,
  CombinedStore,
  StoreSelector,
  StoreMutator,
  AsyncStoreAction,
  StoreSubscription,
  StoreMiddleware,
  DevToolsOptions,
} from './store.types';

// Token types
export type {
  JwtPayload,
  JwtPayloadWithRole,
  DecodedToken,
  JwtHeader,
  TokenPair,
  TokenMetadata,
  TokenStorage,
  TokenValidationResult,
  TokenRefreshResult,
  TokenManagerConfig,
  TokenClaims,
} from './token.types';

export {
  decodeJwt,
  isTokenExpired,
  getTokenExpiryTime,
  getUserIdFromToken,
  isJwtPayload,
  isTokenPair,
  TokenError,
  TokenEvent,
} from './token.types';