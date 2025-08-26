import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt, isTokenExpired } from '@/lib/types/token.types';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-pending',
];

// Define auth routes that should redirect to dashboard if authenticated
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
];

// Define API routes that should be excluded from middleware
const apiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes that don't require auth
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // Check if user is authenticated
  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken);
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       pathname.startsWith('/reset-password/') ||
                       pathname.startsWith('/verify-email/');
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublicRoute) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('from', pathname);
    
    // If there's a refresh token, try to refresh first
    if (refreshToken && !isTokenExpired(refreshToken)) {
      // Set a header to indicate refresh is needed
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('x-needs-refresh', 'true');
      return response;
    }
    
    return NextResponse.redirect(redirectUrl);
  }
  
  // For authenticated requests to API routes, add the token to headers
  if (pathname.startsWith('/api/') && isAuthenticated) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Add user info to headers for server components
  if (isAuthenticated && accessToken) {
    const decoded = decodeJwt(accessToken);
    if (decoded) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.sub);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-name', decoded.name);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};