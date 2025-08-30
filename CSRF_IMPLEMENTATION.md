# CSRF Token Implementation Guide

## Overview

This project includes a complete CSRF (Cross-Site Request Forgery) protection system that integrates with the backend API. The implementation is currently **disabled by default** until the backend `/api/v1/csrf-token` endpoint is implemented.

## Files Created/Modified

### Core CSRF Implementation:
- 📁 **`/src/app/api/csrf-token/route.ts`** - Next.js API route proxy
- 📁 **`/src/hooks/useCsrfToken.ts`** - Main CSRF token hook with TanStack Query
- 📁 **`/src/components/security/CsrfProtectedForm.tsx`** - Form wrapper component
- 📁 **`/src/lib/api/client.ts`** - Enhanced with CSRF token management
- 📁 **`/src/lib/types/api.types.ts`** - Added CSRF types and error codes
- 📁 **`/src/lib/query/query-keys.ts`** - Added security query keys

### Updated Authentication Forms:
- 📁 **Login page** - `/src/app/(auth)/login/page.tsx`
- 📁 **Register page** - `/src/app/(auth)/register/page.tsx`
- 📁 **Forgot password page** - `/src/app/(auth)/forgot-password/page.tsx`
- 📁 **Reset password page** - `/src/app/(auth)/reset-password/[token]/page.tsx`

### Test Files:
- 📁 **`/src/hooks/__tests__/useCsrfToken.test.tsx`**
- 📁 **`/src/components/security/__tests__/CsrfProtectedForm.test.tsx`**
- 📁 **`/src/lib/api/__tests__/client.test.ts`** (enhanced)

## How It Works

### 1. Automatic CSRF Token Management
- Tokens are fetched from `/api/csrf-token` endpoint
- Stored in memory (not localStorage) for security
- Automatically included in POST/PUT/PATCH/DELETE requests
- Refreshed automatically when expired or on 403 errors

### 2. Form Protection
- Forms are wrapped with `<CsrfProtectedForm>` component
- Shows loading states while fetching tokens
- Graceful error handling when CSRF is unavailable

### 3. API Integration
- API client automatically adds `X-CSRF-Token` header
- Handles token refresh on validation failures
- No manual token management required

## Enabling CSRF Protection

### Step 1: Backend Implementation
First, implement the CSRF token endpoint in your backend API:

```typescript
// Backend: /api/v1/csrf-token (GET)
{
  "success": true,
  "data": {
    "csrfToken": "abc123...",
    "expiresAt": "2023-12-01T12:00:00Z"
  }
}
```

### Step 2: Enable Frontend CSRF
Set the environment variable in your `.env.local`:

```bash
NEXT_PUBLIC_ENABLE_CSRF=true
```

### Step 3: Update Form Components
Enable CSRF protection in authentication forms:

```tsx
<CsrfProtectedForm
  showCsrfLoading={true}  // Show loading state
  showCsrfError={true}    // Show error state
  onCsrfError={handleCsrfError}
>
  <LoginForm onSubmit={handleLogin} />
</CsrfProtectedForm>
```

## Current Status

✅ **Frontend implementation complete**  
❌ **Backend CSRF endpoint not implemented yet**  
❌ **CSRF protection disabled by default**

## Testing the Implementation

### 1. Unit Tests
```bash
yarn test useCsrfToken
yarn test CsrfProtectedForm
```

### 2. Integration Testing
```bash
# Enable CSRF in test environment
NEXT_PUBLIC_ENABLE_CSRF=true yarn test
```

### 3. Manual Testing
1. Set `NEXT_PUBLIC_ENABLE_CSRF=true` in `.env.local`
2. Visit authentication pages
3. Check browser network tab for CSRF token requests
4. Forms should show loading states until backend is implemented

## Error Messages

When CSRF is enabled but backend doesn't support it, users will see:
- **JSON Parse Error**: "Unexpected token '<', '<!DOCTYPE'..." 
- **Form Error**: "Security features are temporarily unavailable"

These errors are handled gracefully and won't break the application.

## Security Features

### ✅ Implemented
- In-memory token storage (not persisted)
- Automatic token refresh before expiry
- Request interception for state-changing operations
- Error recovery and user feedback
- Environment-based feature flag

### 🔒 Security Benefits
- Prevents CSRF attacks on form submissions
- Tokens tied to user sessions
- No client-side token exposure
- Automatic cleanup on logout/errors

## Future Enhancements

1. **Double-Submit Cookie Pattern** - Additional CSRF protection layer
2. **Per-Request Tokens** - Unique tokens for each form submission
3. **Token Rotation** - Automatic token rotation on successful submissions
4. **SameSite Cookie Integration** - Enhanced cookie security

## Troubleshooting

### Issue: "Unexpected token '<'" Error
**Cause**: Backend CSRF endpoint returns HTML (404 page) instead of JSON  
**Solution**: Implement backend `/api/v1/csrf-token` endpoint

### Issue: Forms showing loading forever
**Cause**: CSRF enabled but backend endpoint not responding  
**Solution**: Set `NEXT_PUBLIC_ENABLE_CSRF=false` or implement backend

### Issue: "Cannot read properties of undefined (reading 'container')"
**Cause**: Alert component received invalid variant prop  
**Solution**: Fixed - Alert now uses correct variant names

## Implementation Notes

- CSRF tokens are fetched on application startup when enabled
- Tokens are automatically included in API requests
- Forms gracefully degrade when CSRF is unavailable
- All authentication flows are protected by default
- Test coverage includes hook, component, and integration tests

---

**Next Steps**: Implement the backend `/api/v1/csrf-token` endpoint and set `NEXT_PUBLIC_ENABLE_CSRF=true` to activate protection.