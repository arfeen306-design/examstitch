import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to layouts so they can conditionally render Navbar/Footer
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Check if the route belongs to the admin panel
  if (pathname.startsWith('/admin')) {
    // Exclude the login page itself to prevent infinite redirects
    if (pathname === '/admin/login') {
      return response;
    }

    // Check for the admin session cookie
    const authCookie = request.cookies.get('admin_session');

    // Simple gate: cookie must exist and equal 'true'
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
