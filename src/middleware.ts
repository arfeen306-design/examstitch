import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to layouts so they can conditionally render Navbar/Footer
  let response = NextResponse.next({ request });
  response.headers.set('x-pathname', pathname);

  // ── Supabase session refresh + protected route guard ──────────────────────
  // Must run before the admin check so cookies are refreshed on every request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward cookie mutations back to both the request and response.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          response.headers.set('x-pathname', pathname);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session (rotates tokens if needed).
  const { data: { user } } = await supabase.auth.getUser();

  // Guard: /dashboard and /premium require an active session.
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/premium');

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Admin panel guard (cookie-based) ──────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return response;

    const authCookie = request.cookies.get('admin_session');
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
