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

  // ── Admin panel guard (Supabase Auth + role-verified cookie) ──────────────
  // Requires BOTH a valid Supabase session AND an admin_session cookie whose
  // value matches the authenticated user's ID. A student with a normal session
  // cannot access /admin/* because they will never hold a matching cookie.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/forbidden') return response;

    const adminCookie = request.cookies.get('admin_session');

    if (!user || !adminCookie || adminCookie.value !== user.id) {
      const loginUrl = new URL('/admin/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('admin_session');
      redirectResponse.cookies.delete('admin_landing');
      return redirectResponse;
    }

    // ── Role-based routing & subject isolation ─────────────────────────────
    const landing = request.cookies.get('admin_landing')?.value ?? 'default';

    // Auto-redirect bare /admin to the user's landing page
    if (pathname === '/admin' || pathname === '/admin/') {
      if (landing === 'super') {
        return NextResponse.redirect(new URL('/admin/super', request.url));
      }
      if (landing === 'cs') {
        return NextResponse.redirect(new URL('/admin/cs', request.url));
      }
      // 'default' stays at /admin (Maths dashboard)
    }

    // Subject isolation: CS-only admins cannot access Maths dashboard routes
    if (landing === 'cs') {
      const isCsRoute = pathname.startsWith('/admin/cs') || pathname === '/admin/login';
      if (!isCsRoute) {
        return NextResponse.redirect(new URL('/admin/forbidden', request.url));
      }
    }

    // /admin/super is restricted to super admins
    if (pathname.startsWith('/admin/super') && landing !== 'super') {
      return NextResponse.redirect(new URL('/admin/forbidden', request.url));
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
