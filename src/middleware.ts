
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/invoices']; // Ensure '/' is handled correctly if it's protected
const PUBLIC_ROUTES = ['/login']; // Routes accessible without login
const LOGIN_URL = '/login';
const HOME_URL = '/invoices'; // Change default redirect for logged-in users to invoices

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const absoluteUrl = request.url; // Get the full URL for redirection
  console.log(`\n--- Middleware START ---`);
  console.log(`Middleware: Request Path: ${pathname}`);
  console.log(`Middleware: Full URL: ${absoluteUrl}`);


  // **IMPORTANT:** This cookie check is for demonstration ONLY.
  // Replace with secure session/token verification in a real application.
  const isLoggedInCookie = request.cookies.get('app_auth_state'); // Use the same key as AuthContext

  let isAuthenticated = false;
  if (isLoggedInCookie) {
      try {
          // Middleware cannot access localStorage, rely on the cookie.
          // Verify cookie value (e.g., token validation or simple check)
          const parsedState = JSON.parse(decodeURIComponent(isLoggedInCookie.value)); // Decode URI component
          isAuthenticated = !!parsedState.isLoggedIn;
           console.log(`Middleware: Auth cookie found. Parsed state: ${JSON.stringify(parsedState)}. Authenticated: ${isAuthenticated}`);
      } catch (error) {
          console.warn("Middleware: Error parsing auth cookie. Treating as unauthenticated.", error);
          // Clear potentially corrupted cookie? Maybe not needed if HttpOnly.
           isAuthenticated = false; // Ensure it's false on error
      }
  } else {
     console.log("Middleware: No auth cookie found.");
     isAuthenticated = false; // Ensure it's false if no cookie
  }


  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))); // Match base route and sub-paths
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

   console.log(`Middleware: isProtectedRoute=${isProtectedRoute}, isPublicRoute=${isPublicRoute}, isAuthenticated=${isAuthenticated}`);


  // Scenario 1: User is NOT authenticated
  if (!isAuthenticated) {
    console.log(`Middleware: User is NOT authenticated.`);
    // If trying to access a protected route, redirect to login
    if (isProtectedRoute && pathname !== LOGIN_URL) { // Don't redirect if already on login page
      console.log(`Middleware: Unauthenticated access to protected route ${pathname}. Redirecting to ${LOGIN_URL}.`);
      const loginUrl = new URL(LOGIN_URL, absoluteUrl);
      // Optionally add redirect param: loginUrl.searchParams.set('redirectedFrom', pathname);
      console.log(`--- Middleware END (Redirecting to Login) ---`);
      return NextResponse.redirect(loginUrl);
    }
    // If accessing a public route (like /login) or any other non-protected route, allow access
    console.log(`Middleware: Unauthenticated access to route ${pathname}. Allowing.`);
    console.log(`--- Middleware END (Allowing) ---`);
    return NextResponse.next();
  }

  // Scenario 2: User IS authenticated
  if (isAuthenticated) {
     console.log(`Middleware: User IS authenticated.`);
    // If trying to access the login page, redirect to the main invoices page
    if (isPublicRoute && pathname.startsWith(LOGIN_URL)) { // Be specific about login route
      console.log(`Middleware: Authenticated access to login route ${pathname}. Redirecting to ${HOME_URL}.`);
       console.log(`--- Middleware END (Redirecting to Home) ---`);
      return NextResponse.redirect(new URL(HOME_URL, absoluteUrl));
    }
    // If accessing a protected route or any other route (that's not /login), allow access
     console.log(`Middleware: Authenticated access to route ${pathname}. Allowing.`);
      console.log(`--- Middleware END (Allowing) ---`);
    return NextResponse.next();
  }

  // Fallback: Should not be reached if logic is correct, but good practice
  console.warn(`Middleware: Fallback case reached for pathname ${pathname}. Allowing.`);
   console.log(`--- Middleware END (Fallback Allowing) ---`);
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
// Real-world applications should use robust session management (e.g., JWT in HttpOnly cookies).
