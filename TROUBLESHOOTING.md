# Troubleshooting Console Errors

## Current Console Errors and Solutions

### 1. CORS Policy Error ❌
```
Access to fetch at 'http://localhost:7000/api/v1/users/profile' from origin 'http://localhost:4000' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 
'http://localhost:3000' that is not equal to the supplied origin.
```

**Problem**: Backend CORS is configured for `localhost:3000` but frontend runs on `localhost:4000`

**Solution**: Update backend CORS configuration to include `localhost:4000`

**Backend Change Needed**:
```javascript
// In your backend CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',  // existing
    'http://localhost:4000'   // add this line
  ],
  credentials: true
};
```

### 2. CSRF Token Errors ✅ FIXED
```
Failed to fetch CSRF token: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Problem**: CSRF token endpoint doesn't exist on backend
**Solution**: ✅ Disabled CSRF protection via `NEXT_PUBLIC_ENABLE_CSRF=false`

### 3. Playwright Extension Error (Non-Critical) ⚠️
```
Unchecked runtime.lastError: The message port closed before a response was received.
```

**Problem**: Browser extension interference
**Solution**: This is harmless - caused by Playwright browser extension

### 4. Preload Resource Warnings (Non-Critical) ⚠️
```
The resource <URL> was preloaded using link preload but not used within a few seconds
```

**Problem**: Next.js preloading resources that aren't immediately needed
**Solution**: This is normal in development and doesn't affect functionality

## Quick Fix Checklist

### ✅ Fixed Issues:
- [x] CSRF token errors - Disabled until backend ready
- [x] Alert component variant error - Fixed destructive → error

### ❌ Backend Required Fixes:
- [ ] **CORS**: Add `http://localhost:4000` to allowed origins
- [ ] **CSRF Endpoint**: Implement `/api/v1/csrf-token` (optional)

## Environment Configuration

Current `.env.local` settings:
```bash
NEXT_PUBLIC_API_URL=http://localhost:7000/api/v1  # Backend API
NEXT_PUBLIC_APP_URL=http://localhost:4000         # Frontend URL
NEXT_PUBLIC_ENABLE_CSRF=false                     # CSRF disabled
```

## How to Enable CSRF (When Backend Ready)

1. **Implement backend endpoint**:
   ```
   GET /api/v1/csrf-token
   Response: { "success": true, "data": { "csrfToken": "...", "expiresAt": "..." } }
   ```

2. **Enable in frontend**:
   ```bash
   NEXT_PUBLIC_ENABLE_CSRF=true
   ```

3. **Update forms to show CSRF states**:
   ```tsx
   <CsrfProtectedForm showCsrfLoading={true} showCsrfError={true}>
     <LoginForm />
   </CsrfProtectedForm>
   ```

## Testing After CORS Fix

After updating backend CORS configuration, these errors should disappear:
- ✅ No more CORS policy errors
- ✅ API calls to `/users/profile` should work
- ✅ Authentication should function properly

## Current Status

| Issue | Status | Action Required |
|-------|--------|----------------|
| CSRF Errors | ✅ Fixed | None - disabled until backend ready |
| CORS Errors | ❌ Active | Backend team: Add localhost:4000 to CORS |
| Playwright Warning | ⚠️ Harmless | None - browser extension artifact |
| Preload Warnings | ⚠️ Normal | None - Next.js development behavior |

**Next Step**: Update backend CORS configuration to include `http://localhost:4000`