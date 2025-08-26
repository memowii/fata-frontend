/**
 * Query Keys Factory
 * Centralized query key management for consistency and type safety
 */

/**
 * Authentication query keys
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  tokens: () => [...authKeys.all, 'tokens'] as const,
  verification: (token: string) => [...authKeys.all, 'verification', token] as const,
  passwordReset: (token: string) => [...authKeys.all, 'password-reset', token] as const,
} as const;

/**
 * User query keys
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  preferences: () => [...userKeys.all, 'preferences'] as const,
} as const;

/**
 * Article query keys (for future use)
 */
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...articleKeys.lists(), filters] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
  byUser: (userId: string) => [...articleKeys.all, 'by-user', userId] as const,
  favorites: () => [...articleKeys.all, 'favorites'] as const,
} as const;

/**
 * Audio query keys (for future use)
 */
export const audioKeys = {
  all: ['audio'] as const,
  lists: () => [...audioKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...audioKeys.lists(), filters] as const,
  details: () => [...audioKeys.all, 'detail'] as const,
  detail: (id: string) => [...audioKeys.details(), id] as const,
  generation: (articleId: string) => [...audioKeys.all, 'generation', articleId] as const,
  status: (jobId: string) => [...audioKeys.all, 'status', jobId] as const,
} as const;

/**
 * Notification query keys (for future use)
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: { unread?: boolean; type?: string }) => 
    [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
} as const;

/**
 * Settings query keys
 */
export const settingsKeys = {
  all: ['settings'] as const,
  general: () => [...settingsKeys.all, 'general'] as const,
  theme: () => [...settingsKeys.all, 'theme'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  privacy: () => [...settingsKeys.all, 'privacy'] as const,
} as const;

/**
 * Combined query keys for easy import
 */
export const queryKeys = {
  auth: authKeys,
  user: userKeys,
  article: articleKeys,
  audio: audioKeys,
  notification: notificationKeys,
  settings: settingsKeys,
} as const;

/**
 * Mutation keys for consistency
 */
export const mutationKeys = {
  // Auth mutations
  login: ['auth', 'login'] as const,
  register: ['auth', 'register'] as const,
  logout: ['auth', 'logout'] as const,
  refreshToken: ['auth', 'refresh'] as const,
  verifyEmail: ['auth', 'verify-email'] as const,
  forgotPassword: ['auth', 'forgot-password'] as const,
  resetPassword: ['auth', 'reset-password'] as const,
  resendVerification: ['auth', 'resend-verification'] as const,
  
  // User mutations
  updateProfile: ['user', 'update-profile'] as const,
  updatePassword: ['user', 'update-password'] as const,
  deleteAccount: ['user', 'delete-account'] as const,
  updatePreferences: ['user', 'update-preferences'] as const,
  
  // Article mutations (for future use)
  createArticle: ['article', 'create'] as const,
  updateArticle: ['article', 'update'] as const,
  deleteArticle: ['article', 'delete'] as const,
  favoriteArticle: ['article', 'favorite'] as const,
  
  // Audio mutations (for future use)
  generateAudio: ['audio', 'generate'] as const,
  deleteAudio: ['audio', 'delete'] as const,
  
  // Settings mutations
  updateSettings: ['settings', 'update'] as const,
} as const;

/**
 * Type for all query keys
 */
export type QueryKey = 
  | ReturnType<typeof authKeys[keyof typeof authKeys]>
  | ReturnType<typeof userKeys[keyof typeof userKeys]>
  | ReturnType<typeof articleKeys[keyof typeof articleKeys]>
  | ReturnType<typeof audioKeys[keyof typeof audioKeys]>
  | ReturnType<typeof notificationKeys[keyof typeof notificationKeys]>
  | ReturnType<typeof settingsKeys[keyof typeof settingsKeys]>;

/**
 * Type for all mutation keys
 */
export type MutationKey = typeof mutationKeys[keyof typeof mutationKeys];