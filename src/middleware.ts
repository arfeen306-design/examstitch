import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the route belongs to the admin panel
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude the login page itself to prevent infinite redirects
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for the admin session cookie
    const authCookie = request.cookies.get('admin_session');

    // Simple gate: cookie must exist and equal 'true'
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
