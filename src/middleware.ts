
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/invoices']; // Add other protected routes here
const PUBLIC_ROUTES = ['/login']; // Routes accessible without login

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Attempt to retrieve authentication status (using a cookie is preferred for middleware)
  // For demonstration, we'll assume a simple cookie or header might exist.
  // In a real app, verify a session token (e.g., JWT) stored in an HttpOnly cookie.
  // Since middleware runs server-side, it cannot directly access localStorage.
  // We'll simulate a check based on a hypothetical cookie.
  const isLoggedInCookie = request.cookies.get('isLoggedIn'); // Hypothetical cookie

  const isAuthenticated = !!isLoggedInCookie && isLoggedInCookie.value === 'true'; // Basic check

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // If trying to access a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    console.log(`Middleware: Unauthenticated access to ${pathname}. Redirecting to /login.`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: pass redirect info
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access a public route (like login) while already authenticated, redirect to home
  if (isPublicRoute && isAuthenticated) {
     console.log(`Middleware: Authenticated access to ${pathname}. Redirecting to /.`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow the request to proceed if none of the above conditions are met
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// NOTE: This middleware uses a simple cookie check for demonstration.
// Real-world applications should use robust session management (e.g., JWT in HttpOnly cookies)
// and potentially database lookups to verify authentication status securely in middleware.
// The client-side AuthContext handles the UI state based on localStorage,
// while middleware enforces server-side route protection.
