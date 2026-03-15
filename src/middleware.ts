import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const familyAuth = request.cookies.get('family_auth')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Allow unrestricted access to the API routes explicitly meant to run in the background if we needed them 
  // (e.g., cron jobs, etc - though we'll protect basic routes)
  if (!familyAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Pass through if they have the cookie or are going to login
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - manifest.json (PWA)
     * - icons (PWA icons)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|icon.*\\.(?:ico|png|jpg)).*)',
  ],
};
