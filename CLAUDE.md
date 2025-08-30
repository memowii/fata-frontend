# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General project context

To gain a general context of what we're building and project's docs you can read these files:

@documentation/from-article-to-audio-srs-v1.2.md <br>
@documentation/api-docs-v1.json <br>
@TEST_DOCUMENTATION.md <br>
@TANSTACK_QUERY_SETUP.md

## Development Commands

### Package Manager
This project uses **Yarn** as the package manager. Always use `yarn` instead of `npm`.

### Essential Commands
- `yarn dev` - Start development server at http://localhost:4000
- `yarn build` - Create production build
- `yarn start` - Run production server
- `yarn lint` - Run ESLint to check code quality

### Installing Dependencies
- `yarn add <package>` - Add production dependency
- `yarn add -D <package>` - Add development dependency

## Project Architecture

This is a **Next.js 15.4.5** application using the **App Router** architecture with React 19, TypeScript 5, and Tailwind CSS v4.

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with HTML structure and font setup
  - `page.tsx` - Page components
  - `globals.css` - Global styles with Tailwind CSS directives
- `public/` - Static assets served directly

### Key Technologies
- **Framework**: Next.js 15.4.5 with App Router
- **UI**: React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Language**: TypeScript with strict mode
- **Fonts**: Geist Sans and Geist Mono via next/font/google

### Path Aliases
TypeScript is configured with path aliases:
- `@/*` maps to `./src/*`

Example: `import Component from '@/app/components/Component'`

### Styling Approach
- Tailwind CSS v4 for utility-first styling
- CSS variables for theming (supports dark mode)
- Global styles in `src/app/globals.css`
- Use Tailwind classes directly in JSX

### Next.js App Router Conventions
- File-based routing in `src/app/`
- `layout.tsx` for shared layouts
- `page.tsx` for page components
- `loading.tsx` for loading states
- `error.tsx` for error boundaries
- Metadata API for SEO

### Component Development
When creating new components:
1. Place them in `src/app/components/`
2. Use TypeScript for type safety
3. Apply Tailwind classes for styling
4. Follow React 19 patterns (no need for React imports)

## Authentication Best Practices

### httpOnly Cookies Pattern
When using httpOnly cookies for JWT tokens, client-side JavaScript cannot read them. Always create Next.js API routes (`/api/auth/*`) as intermediaries that can:
- Access cookies server-side
- Add Authorization headers when calling the backend
- Handle token refresh logic

Example flow:
```
Client → /api/auth/logout → Backend (with Authorization header)
```

### Error Handling Layers
Follow this three-layer error handling pattern to prevent "Uncaught promise" console errors:

1. **Service layer** (`client.ts`): Should throw errors
   ```typescript
   if (!response.ok) throw new Error(error.message)
   ```

2. **Application layer** (`AuthContext`): Should catch errors, set them in state, but NOT re-throw
   ```typescript
   try {
     await clientLogin(credentials)
   } catch (error) {
     setError(message)  // Set in state
     return null        // Don't re-throw!
   }
   ```

3. **UI layer**: Should display errors from state/props
   ```typescript
   {error && <Alert>{error}</Alert>}
   ```

### Backend Compatibility
Always verify what the backend expects:
- Authorization headers for protected endpoints (e.g., logout)
- Request body format and field names
- Response structure for proper error handling

## UX Best Practices

### Password Requirements Display
- **Registration forms**: Show password validation rules as helper text
- **Login forms**: Do NOT show password creation rules (users already have accounts)

### Email Verification Flow
After registration, implement a clear verification flow:
1. Redirect to `/verify-pending` page
2. Display user's email address
3. Provide clear instructions
4. Include resend option with countdown timer (60s)
5. Handle both query parameter (`?token=`) and path parameter (`/verify-email/[token]`) formats

### Data Sanitization
Always clean user input before sending to backend:
```typescript
// Clean names by removing extra spaces
const cleanedName = name.trim().replace(/\s+/g, ' ')
// 'Guillermo   Garcia   ' → 'Guillermo Garcia'
```

## Component Design Patterns

### Text Visibility in Themed Components
For Alert/Card components, use `text-foreground` instead of variant-specific colors to ensure proper contrast in both light and dark modes:
```typescript
// Good - ensures contrast
container: 'bg-success/10 text-foreground'

// Avoid - might have poor contrast
container: 'bg-success/10 text-success'
```

### Form State Management
- Use form-level error state from AuthContext
- Don't duplicate error handling in form components
- Let AuthContext manage navigation after success