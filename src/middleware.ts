import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  PORTAL_ROUTE_SEGMENTS,
  SHARED_ADMIN_ROUTES,
  getAllowedRouteSegments,
} from '@/config/admin-portals';

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

  // ── Admin panel guard (Supabase Auth + role-verified cookie) ──────────────
  // Requires BOTH a valid Supabase session AND an admin_session cookie whose
  // value matches the authenticated user's ID. A student with a normal session
  // cannot access /admin/* because they will never hold a matching cookie.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/forbidden') return response;

    const adminCookie = request.cookies.get('admin_session');

    if (!user || !adminCookie || adminCookie.value !== user.id) {
      // Redirect to admin login but preserve admin_session + admin_mode cookies.
      // They'll still work for public content bypass even if the Supabase JWT expired.
      // Re-login at /admin/login will refresh everything.
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // ── Role-based routing & subject isolation ─────────────────────────────
    const landing = request.cookies.get('admin_landing')?.value ?? 'default';

    // Auto-redirect bare /admin to the user's landing page
    if (pathname === '/admin' || pathname === '/admin/') {
      if (landing !== 'default') {
        return NextResponse.redirect(new URL(`/admin/${landing}`, request.url));
      }
      // 'default' stays at /admin (Maths dashboard)
    }

    // /admin/super is restricted to super admins
    if (pathname.startsWith('/admin/super') && landing !== 'super') {
      return NextResponse.redirect(new URL('/admin/forbidden', request.url));
    }

    // ── Generic subject isolation ──────────────────────────────────────────
    // Non-super admins can only access their assigned subject portals.
    // `admin_subjects` (set in api/admin/login) contains comma-separated slugs from
    // public.subjects.slug (e.g. maths, computer-science) and/or subject_papers.slug
    // (e.g. mathematics-4024). See supabase/migrations/012_multi_subject.sql and
    // src/config/admin-portals.ts (dbSubjectSlugs + subjectPaperSlugPrefixes).
    if (landing !== 'super') {
      const subjectsCookie = request.cookies.get('admin_subjects')?.value ?? '';
      const assignedSlugs = subjectsCookie
        ? subjectsCookie.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const allowedRoutes = getAllowedRouteSegments(assignedSlugs);

      // Check subject portal routes: /admin/cs, /admin/physics, etc.
      const subjectPortalMatch = pathname.match(/^\/admin\/([a-z-]+)/);
      if (subjectPortalMatch) {
        const segment = subjectPortalMatch[1];

        // If it's a subject portal and admin doesn't have access → block
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
