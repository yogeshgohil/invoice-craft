
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/invoices']; // Add other protected routes here, ensure '/' is handled correctly
const PUBLIC_ROUTES = ['/login']; // Routes accessible without login
const LOGIN_URL = '/login';
const HOME_URL = '/'; // Or your main dashboard route

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const absoluteUrl = request.url; // Get the full URL for redirection

  // **IMPORTANT:** This cookie check is for demonstration ONLY.
  // Replace with secure session/token verification in a real application.
  const isLoggedInCookie = request.cookies.get('app_auth_state'); // Use the same key as AuthContext (though value format differs)

  let isAuthenticated = false;
  if (isLoggedInCookie) {
      try {
          // Middleware cannot access localStorage, so we rely on the cookie.
          // Here we just check if the cookie exists and has a truthy 'isLoggedIn' property.
          // In a real app, you'd verify a token from the cookie.
          const parsedState = JSON.parse(isLoggedInCookie.value); // Assuming cookie stores JSON string like localStorage
          isAuthenticated = !!parsedState.isLoggedIn;
      } catch (error) {
          console.warn("Middleware: Error parsing auth cookie. Treating as unauthenticated.", error);
          // Clear potentially corrupted cookie? Maybe not needed if HttpOnly.
      }
  }


  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname === '/' || (route !== '/' && pathname.startsWith(route)));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Scenario 1: User is NOT authenticated
  if (!isAuthenticated) {
    // If trying to access a protected route, redirect to login
    if (isProtectedRoute) {
      console.log(`Middleware: Unauthenticated access to protected route ${pathname}. Redirecting to ${LOGIN_URL}.`);
      const loginUrl = new URL(LOGIN_URL, absoluteUrl);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If accessing a public route (like /login) or any other non-protected route, allow access
    console.log(`Middleware: Unauthenticated access to non-protected route ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // Scenario 2: User IS authenticated
  if (isAuthenticated) {
    // If trying to access the login page, redirect to the home/dashboard page
    if (isPublicRoute) {
      console.log(`Middleware: Authenticated access to public route ${pathname}. Redirecting to ${HOME_URL}.`);
      return NextResponse.redirect(new URL(HOME_URL, absoluteUrl));
    }
    // If accessing a protected route or any other route (that's not /login), allow access
     console.log(`Middleware: Authenticated access to route ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // Fallback: Should not be reached if logic is correct, but good practice
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
// while middleware enforces server-side route protection. Ensure cookie logic aligns
// with how AuthContext sets authentication state if using cookies for both.
// Using different mechanisms (localStorage client-side, cookie server-side) requires careful synchronization.
