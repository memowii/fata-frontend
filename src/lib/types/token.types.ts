/**
 * JWT and token-related types for authentication
 * Handles token parsing, validation, and management
 */

/**
 * JWT payload structure based on RFC 7519
 * Contains claims about the authenticated user
 */
export interface JwtPayload {
  /** Subject - User ID */
  sub: string;
  /** User email */
  email: string;
  /** User name */
  name: string;
  /** Issued at timestamp (seconds since epoch) */
  iat?: number;
  /** Expiration timestamp (seconds since epoch) */
  exp?: number;
  /** Not before timestamp (seconds since epoch) */
  nbf?: number;
  /** JWT ID for tracking */
  jti?: string;
  /** Issuer of the token */
  iss?: string;
  /** Intended audience */
  aud?: string | string[];
  /** Additional custom claims */
  [key: string]: unknown;
}

/**
 * Extended JWT payload with role information
 */
export interface JwtPayloadWithRole extends JwtPayload {
  /** User role(s) */
  role?: string | string[];
  /** User permissions */
  permissions?: string[];
}

/**
 * Decoded JWT token structure
 */
export interface DecodedToken {
  /** Token header */
  header: JwtHeader;
  /** Token payload */
  payload: JwtPayload;
  /** Token signature */
  signature: string;
}

/**
 * JWT header structure
 */
export interface JwtHeader {
  /** Signature algorithm (e.g., 'HS256', 'RS256') */
  alg: string;
  /** Token type (typically 'JWT') */
  typ: 'JWT' | string;
  /** Key ID for key rotation */
  kid?: string;
}

/**
 * Token pair for access and refresh tokens
 */
export interface TokenPair {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** Token type (typically 'Bearer') */
  tokenType: 'Bearer';
  /** Access token expiration time */
  expiresIn: string | number;
  /** Refresh token expiration time */
  refreshExpiresIn?: string | number;
}

/**
 * Token metadata for storage and management
 */
export interface TokenMetadata {
  /** When the token was received */
  receivedAt: number;
  /** When the token expires (milliseconds since epoch) */
  expiresAt: number;
  /** When the refresh token expires (milliseconds since epoch) */
  refreshExpiresAt?: number;
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
  /** Number of times token has been refreshed */
  refreshCount: number;
  /** Last refresh timestamp */
  lastRefreshedAt?: number;
}

/**
 * Token storage interface for persistence
 */
export interface TokenStorage {
  /** Get stored tokens */
  getTokens: () => Promise<TokenPair | null>;
  /** Store tokens */
  setTokens: (tokens: TokenPair) => Promise<void>;
  /** Clear stored tokens */
  clearTokens: () => Promise<void>;
  /** Get token metadata */
  getMetadata: () => Promise<TokenMetadata | null>;
  /** Update token metadata */
  setMetadata: (metadata: TokenMetadata) => Promise<void>;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** Whether the token is expired */
  isExpired: boolean;
  /** Time until expiration in seconds */
  expiresIn?: number;
  /** Validation error if any */
  error?: string;
  /** Decoded payload if valid */
  payload?: JwtPayload;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  /** Whether refresh was successful */
  success: boolean;
  /** New token pair if successful */
  tokens?: TokenPair;
  /** Error message if failed */
  error?: string;
  /** Whether user needs to re-authenticate */
  requiresReauth?: boolean;
}

/**
 * Token manager configuration
 */
export interface TokenManagerConfig {
  /** Storage implementation */
  storage?: TokenStorage;
  /** Auto-refresh enabled */
  autoRefresh?: boolean;
  /** Refresh threshold in seconds before expiry */
  refreshThreshold?: number;
  /** Maximum refresh attempts */
  maxRefreshAttempts?: number;
  /** Refresh retry delay in milliseconds */
  refreshRetryDelay?: number;
  /** Token validation interval in milliseconds */
  validationInterval?: number;
  /** Callback when tokens are refreshed */
  onTokenRefresh?: (tokens: TokenPair) => void;
  /** Callback when refresh fails */
  onRefreshError?: (error: Error) => void;
  /** Callback when user needs to re-authenticate */
  onReauthRequired?: () => void;
}

/**
 * Token claims for authorization
 */
export interface TokenClaims {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User roles */
  roles?: string[];
  /** User permissions */
  permissions?: string[];
  /** Organization ID */
  organizationId?: string;
  /** Session ID */
  sessionId?: string;
  /** Device ID */
  deviceId?: string;
}

/**
 * Utility function to decode JWT without verification
 * WARNING: This does not verify the signature
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get time until token expiration in seconds
 */
export function getTokenExpiryTime(token: string): number {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return 0;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Extract user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.sub || null;
}

/**
 * Type guard to check if a value is a valid JWT payload
 */
export function isJwtPayload(value: unknown): value is JwtPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sub' in value &&
    'email' in value &&
    'name' in value &&
    typeof (value as JwtPayload).sub === 'string' &&
    typeof (value as JwtPayload).email === 'string' &&
    typeof (value as JwtPayload).name === 'string'
  );
}

/**
 * Type guard to check if a value is a valid token pair
 */
export function isTokenPair(value: unknown): value is TokenPair {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    'refreshToken' in value &&
    'tokenType' in value &&
    'expiresIn' in value &&
    typeof (value as TokenPair).accessToken === 'string' &&
    typeof (value as TokenPair).refreshToken === 'string'
  );
}

/**
 * Token error types for specific error handling
 */
export enum TokenError {
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  MALFORMED_TOKEN = 'MALFORMED_TOKEN',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

/**
 * Token event types for event-driven token management
 */
export enum TokenEvent {
  TOKEN_RECEIVED = 'TOKEN_RECEIVED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
}