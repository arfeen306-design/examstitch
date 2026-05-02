import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import {
  PORTAL_ROUTE_SEGMENTS,
  SHARED_ADMIN_ROUTES,
} from '@/config/taxonomy';
import {
  resolveAdminRoleForMiddleware,
  isStillAdmin,
  type CachedAdminRole,
} from '@/lib/admin/middleware-role-cache';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to layouts so they can conditionally render Navbar/Footer
  let response = NextResponse.next({ request });
  response.headers.set('x-pathname', pathname);

  // ── Supabase session refresh + protected route guard ──────────────────────
  // Must run before the admin check so cookies are refreshed on every request.
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  let user: { id: string; email?: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Network / token parse error — treat as unauthenticated
  }

  // ── Admin mode sync: ensure admin_mode cookie exists when admin_session is set ─
  // httpOnly: false is intentional — this is a UI-only hint so client components
  // can hide lock badges. It is NOT a security gate; actual auth is enforced
  // server-side via the httpOnly admin_session cookie + Supabase JWT.
  const adminSessionCookie = request.cookies.get('admin_session');
  if (adminSessionCookie?.value && !request.cookies.get('admin_mode')?.value) {
    response.cookies.set('admin_mode', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  // Guard: /dashboard and /premium require an active session.
  // Admins with a valid admin_session cookie bypass this check.
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/premium');

  if (isProtected && !user) {
    const adminCookie = request.cookies.get('admin_session');
    if (!adminCookie?.value) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Admin panel guard ─────────────────────────────────────────────────────
  // Three layers of trust on every request:
  //   1. Valid Supabase session JWT.
  //   2. Opaque admin_session cookie that resolves to a live admin_sessions row.
  //   3. Role re-fetched from student_accounts (cached 60s) — demoted admins
  //      lose access within one TTL cycle, not 7 days.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/forbidden') return response;

    const adminToken = request.cookies.get('admin_session')?.value;
    if (!user || !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Resolve the token → {user_id, role, isSuperAdmin, managedSubjects}.
    // The helper checks an in-process 60s cache first, then falls back to a
    // service-role lookup against admin_sessions JOIN student_accounts.
    let role: CachedAdminRole | null;
    try {
      role = await resolveAdminRoleForMiddleware(adminToken);
    } catch {
      role = null;
    }

    if (!role || role.userId !== user.id || !isStillAdmin(role)) {
      // Cookie is stale, role was revoked, or user mismatch → boot to login.
      const redirect = NextResponse.redirect(new URL('/admin/login', request.url));
      redirect.cookies.delete('admin_session');
      redirect.cookies.delete('admin_mode');
      redirect.cookies.delete('admin_landing');
      redirect.cookies.delete('admin_subjects');
      return redirect;
    }

    // ── Role-based routing & subject isolation (live data, not cookies) ────
    const landing = role.isSuperAdmin
      ? 'super'
      : role.routeSegments[0] ?? 'default';

    // Auto-redirect bare /admin to the resolved landing page
    if (pathname === '/admin' || pathname === '/admin/') {
      if (landing !== 'default') {
        return NextResponse.redirect(new URL(`/admin/${landing}`, request.url));
      }
    }

    // /admin/super is restricted to super admins
    if (pathname.startsWith('/admin/super') && !role.isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/forbidden', request.url));
    }

    if (!role.isSuperAdmin) {
      const allowedRoutes = new Set(role.routeSegments);
      const subjectPortalMatch = pathname.match(/^\/admin\/([a-z-]+)/);
      if (subjectPortalMatch) {
        const segment = subjectPortalMatch[1];
        if (PORTAL_ROUTE_SEGMENTS.has(segment) && !SHARED_ADMIN_ROUTES.has(segment) && !allowedRoutes.has(segment)) {
          return NextResponse.redirect(new URL('/admin/forbidden', request.url));
        }
      }
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
